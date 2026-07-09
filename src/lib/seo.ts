import { mediaUrl, WP_MEDIA_BASE } from './api';

// GraphQL fragment body for Rank Math SEO data. Spread it into any post/page/
// term selection: `... { ${SEO_FRAGMENT} }`.
export const SEO_FRAGMENT = `
    seo {
      title
      description
      focusKeywords
      openGraph {
        type
        title
        description
        image { url }
      }
      jsonLd { raw }
    }`;

export interface BuiltSeo {
  title?: string;
  description?: string;
  canonical: string;
  robots: string;
  keywords?: string;
  ogType: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl: string;
  jsonLd?: string;
}

function absolute(u: string | undefined, origin?: string): string | undefined {
  if (!u) return u;
  if (/^https?:\/\//.test(u)) return u;
  if (origin && u.startsWith('/')) return origin.replace(/\/$/, '') + u;
  return u;
}

// Hosts that must never appear in public markup: the editor's local WordPress,
// or anything on a private network they may have typed into their WP profile.
const PRIVATE_HOST = /^https?:\/\/(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|[^/]*\.local\b)/i;

const typesOf = (node: any): string[] => {
  const t = node?.['@type'];
  return Array.isArray(t) ? t : t ? [t] : [];
};

// Recursively rewrite the WordPress origin to the frontend origin and drop any
// private-network URL found inside a string array (e.g. Person.sameAs).
function scrub(value: any, wp: string, site: string): any {
  if (typeof value === 'string') return wp && site ? value.split(wp).join(site) : value;
  if (Array.isArray(value)) {
    return value
      .map((v) => scrub(v, wp, site))
      .filter((v) => !(typeof v === 'string' && PRIVATE_HOST.test(v)));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const k of Object.keys(value)) out[k] = scrub(value[k], wp, site);
    return out;
  }
  return value;
}

// Rank Math builds this JSON-LD inside WordPress, so it embeds CMS-side details
// that should not be published on the frontend:
//   - the CMS hostname, which the /media proxy otherwise keeps private
//   - a Person node exposing the WP account name, its author-archive URL and a
//     gravatar hash (a fingerprint of the account's email address)
//   - whatever URL the author typed into their WP profile "Website" field,
//     which on a dev machine is "http://localhost/..."
// Together those hand an attacker a valid username plus the wp-login location.
// Drop the Person entirely and re-point anything that referenced it at the
// Organization, so the remaining graph stays a valid rich result.
function sanitizeJsonLd(raw: string, origin?: string): string {
  // Rank Math's `jsonLd { raw }` arrives WRAPPED in its <script type="application/
  // ld+json"> tag, so JSON.parse on the whole string fails. Unwrap, sanitize the
  // JSON payload, then restore the same wrapper (Layout injects this via set:html).
  const wrap = raw.match(/^\s*(<script[^>]*>)([\s\S]*?)(<\/script>)\s*$/i);
  if (wrap) {
    const inner = sanitizeJsonLd(wrap[2], origin);
    return inner ? wrap[1] + inner + wrap[3] : '';
  }

  const wp = (WP_MEDIA_BASE || '').replace(/\/+$/, '');
  const site = (origin || '').replace(/\/+$/, '');

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    // Unparseable: still never leak the CMS host or a localhost URL.
    const textOnly = wp && site ? raw.split(wp).join(site) : raw;
    return textOnly.replace(/"https?:\/\/(localhost|127\.0\.0\.1)[^"]*"/gi, '""');
  }

  const graph: any[] = Array.isArray(data['@graph'])
    ? data['@graph']
    : Array.isArray(data)
      ? data
      : [data];

  const orgId = graph.find((n) => typesOf(n).includes('Organization'))?.['@id'];
  const personIds = new Set(
    graph.filter((n) => typesOf(n).includes('Person')).map((n) => n['@id']).filter(Boolean),
  );

  const kept = graph.filter((n) => !typesOf(n).includes('Person'));
  for (const node of kept) {
    for (const key of ['author', 'creator', 'editor', 'publisher']) {
      const ref = node[key];
      if (ref && typeof ref === 'object' && personIds.has(ref['@id'])) {
        if (orgId) node[key] = { '@id': orgId };
        else delete node[key];
      }
    }
  }

  if (!kept.length) return '';
  const cleaned = scrub(kept, wp, site);

  if (Array.isArray(data['@graph'])) {
    const rest: Record<string, any> = {};
    for (const k of Object.keys(data)) if (k !== '@graph') rest[k] = scrub(data[k], wp, site);
    return JSON.stringify({ ...rest, '@graph': cleaned });
  }
  return JSON.stringify(Array.isArray(data) ? cleaned : cleaned[0]);
}

// Turn Rank Math SEO (+ fallbacks) into a normalized, frontend-correct meta set.
// canonical/og:url come from the FRONTEND url (Rank Math returns WP permalinks,
// whose path differs from the Astro route); og:image and JSON-LD image URLs are
// rewritten through the same-origin /media proxy.
export function buildSeo(opts: {
  seo?: any;
  url: string;
  origin?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackImage?: string;
}): BuiltSeo {
  const { seo, origin } = opts;
  const canonical = absolute(opts.url, origin) || opts.url;

  const title = seo?.title || opts.fallbackTitle;
  const description = seo?.description || opts.fallbackDescription;
  const og = seo?.openGraph || {};

  const ogImageRaw = og.image?.url
    ? mediaUrl(og.image.url)
    : opts.fallbackImage
      ? mediaUrl(opts.fallbackImage)
      : undefined;
  const ogImage = absolute(ogImageRaw, origin);

  // JSON-LD: point image URLs at the same-origin /media proxy, then strip the
  // CMS host + author/Person node so no wp-admin details leak into public markup.
  let jsonLd: string | undefined = seo?.jsonLd?.raw || undefined;
  if (jsonLd) {
    const mediaBase = (origin ? origin.replace(/\/$/, '') : '') + '/media/';
    jsonLd = jsonLd.replace(/https?:\/\/[^"'\s\\]*?\/wp-content\/uploads\//g, mediaBase);
    jsonLd = sanitizeJsonLd(jsonLd, origin) || undefined;
  }

  return {
    title,
    description,
    canonical,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    keywords: seo?.focusKeywords || undefined,
    ogType: og.type || 'website',
    ogTitle: og.title || title,
    ogDescription: og.description || description,
    ogImage,
    ogUrl: canonical,
    jsonLd,
  };
}
