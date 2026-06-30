import { mediaUrl } from './api';

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

  // JSON-LD: point image URLs at the same-origin /media proxy.
  let jsonLd: string | undefined = seo?.jsonLd?.raw || undefined;
  if (jsonLd) {
    const mediaBase = (origin ? origin.replace(/\/$/, '') : '') + '/media/';
    jsonLd = jsonLd.replace(/https?:\/\/[^"'\s\\]*?\/wp-content\/uploads\//g, mediaBase);
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
