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
