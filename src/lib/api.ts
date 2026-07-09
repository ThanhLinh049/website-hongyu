interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

// Configurable WordPress media origin — so image paths are NOT hardcoded to
// "http://localhost/hongyu". By default it follows WORDPRESS_API_URL's host
// (the same var you change on deploy), or set PUBLIC_WP_URL to override it.
// Set PUBLIC_WP_URL="" when media is served from the same domain as the
// frontend, and images become fully relative ("/wp-content/...").
export const WP_MEDIA_BASE: string = (() => {
  const override =
    import.meta.env.PUBLIC_WP_URL ??
    (typeof process !== 'undefined' ? process.env.PUBLIC_WP_URL : undefined);
  if (override !== undefined) return String(override).replace(/\/+$/, '');
  const api =
    import.meta.env.WORDPRESS_API_URL ||
    (typeof process !== 'undefined' ? process.env.WORDPRESS_API_URL : undefined) ||
    'http://localhost/hongyu/graphql';
  return api.replace(/\/graphql\/?$/, '').replace(/\/+$/, '');
})();

// Media proxy toggle. When on (default), WordPress images are rewritten to a
// same-origin "/media/..." path served by src/pages/media/[...path].ts — this
// hides the WP/CMS domain, gives one origin for every image, and lets us send
// long-lived immutable cache headers. Set PUBLIC_MEDIA_PROXY="0" to fall back to
// absolute WP URLs (the previous behaviour).
export const MEDIA_PROXY: boolean = (() => {
  const v =
    import.meta.env.PUBLIC_MEDIA_PROXY ??
    (typeof process !== 'undefined' ? process.env.PUBLIC_MEDIA_PROXY : undefined);
  return !(v === '0' || v === 'false');
})();

// Origin WordPress serves uploads from, e.g. "http://localhost/hongyu". The
// /media proxy endpoint fetches the real bytes from here.
export const WP_UPLOADS_ORIGIN: string = WP_MEDIA_BASE;

// Normalize a WordPress media URL.
//  - Proxy ON  → "/media/2026/06/x.png"  (same-origin, domain-independent)
//  - Proxy OFF → "<WP_MEDIA_BASE>/wp-content/uploads/2026/06/x.png"
// External images (no "/wp-content/uploads/") are returned unchanged.
export function mediaUrl(u: any): any {
  if (!u || typeof u !== 'string') return u;
  const up = u.indexOf('/wp-content/uploads/');
  if (up >= 0) {
    const rel = u.slice(up + '/wp-content/uploads/'.length);
    return MEDIA_PROXY ? '/media/' + rel : WP_MEDIA_BASE + u.slice(u.indexOf('/wp-content/'));
  }
  // Other wp-content assets (themes/plugins) — keep them resolvable.
  const wc = u.indexOf('/wp-content/');
  if (wc >= 0) return WP_MEDIA_BASE + u.slice(wc);
  return u;
}

// Rewrite WordPress upload URLs embedded INSIDE an HTML string (e.g. a post's
// `content` from the editor) through mediaUrl() — the same normalization
// normalizeMedia() applies to `sourceUrl` fields, but for URLs baked into
// markup. Editor-inserted <img>/<a> carry absolute WP URLs, and if the CMS DB
// was never search-replaced they can still be "http://localhost/hongyu/...";
// this turns them into same-origin /media paths so nothing leaks a WP/localhost
// host into the page. Returns the input unchanged when there's nothing to fix.
export function rewriteHtmlMedia(html: any): any {
  if (!html || typeof html !== 'string') return html;
  return html.replace(
    /https?:\/\/[^\s"'<>)]+?\/wp-content\/uploads\/[^\s"'<>)]+/g,
    (m) => mediaUrl(m),
  );
}

// Walk a GraphQL response and rewrite every "sourceUrl" through mediaUrl(), so
// all pages get portable, domain-independent image paths with no per-component
// changes. Mutates and returns the same object.
export function normalizeMedia(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) data[i] = normalizeMedia(data[i]);
    return data;
  }
  for (const k of Object.keys(data)) {
    if (k === 'sourceUrl' && typeof data[k] === 'string') data[k] = mediaUrl(data[k]);
    else data[k] = normalizeMedia(data[k]);
  }
  return data;
}

export async function wpQuery({ query, variables = {} }: GraphQLRequest) {
  // Build-time vars come from import.meta.env; Vercel serverless runtime exposes process.env.
  const url =
    import.meta.env.WORDPRESS_API_URL ||
    (typeof process !== 'undefined' ? process.env.WORDPRESS_API_URL : undefined) ||
    'http://localhost/hongyu/graphql';

  // On Vercel there is no localhost WordPress to reach. If WORDPRESS_API_URL
  // hasn't been set to a public endpoint, skip the request entirely so pages
  // render their built-in fallback content cleanly — no ECONNREFUSED noise on
  // every build/SSR call. (Local builds against local WP are unaffected.)
  const onVercel = typeof process !== 'undefined' && !!process.env.VERCEL;
  const isLocalhost = /localhost|127\.0\.0\.1/.test(url);
  if (onVercel && isLocalhost) {
    console.info('[wpQuery] WORDPRESS_API_URL is not set to a public endpoint — using fallback content.');
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();
    if (json.errors) {
      console.error('GraphQL Query Errors:', json.errors);
      throw new Error('Failed to execute GraphQL query');
    }
    return normalizeMedia(json.data);
  } catch (error) {
    console.error('Fetch error from WP API:', error);
    throw error;
  }
}

// Enumerate EVERY node of a paginated WPGraphQL connection by following cursors
// 100 at a time. Used by getStaticPaths() to list all pages to prerender at
// build — WPGraphQL caps `first` at 100, so a single query would silently miss
// items past the first page. Returns [] on any failure so the build still
// succeeds (that route just prerenders no dynamic pages instead of crashing).
//
//   field:     connection root, e.g. "posts" | "products" | "productCategories"
//   selection: fields to pull per node, e.g. "slug productCategories { nodes { slug } }"
//   where:     optional extra args, e.g. 'where: { hideEmpty: false }'
export async function fetchAllNodes(
  field: string,
  selection: string,
  where = '',
): Promise<any[]> {
  const out: any[] = [];
  let after: string | null = null;
  try {
    // Hard cap (200 pages × 100 = 20k) so a malformed pageInfo can't loop forever.
    for (let i = 0; i < 200; i++) {
      const args =
        `first: 100, after: ${after ? JSON.stringify(after) : 'null'}` +
        (where ? `, ${where}` : '');
      const data: any = await wpQuery({
        query: `{ ${field}(${args}) { pageInfo { hasNextPage endCursor } nodes { ${selection} } } }`,
      });
      const conn = data?.[field];
      if (!conn) break;
      out.push(...(conn.nodes || []));
      if (!conn.pageInfo?.hasNextPage) break;
      after = conn.pageInfo.endCursor;
    }
  } catch (e) {
    console.warn(`[fetchAllNodes] ${field} pagination failed`, e);
  }
  return out;
}
