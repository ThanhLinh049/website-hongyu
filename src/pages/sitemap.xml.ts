import type { APIRoute } from 'astro';
import { wpQuery } from '../lib/api';

// Dynamic XML sitemap built from live WordPress content. Lists the static
// routes plus every product, product category, portfolio project and blog post,
// using the frontend's own origin (configured `site` on deploy, else request).
// Static: regenerated at build (deploy), consistent with the rest of the site.
// Requires PUBLIC_SITE_URL so absolute URLs point at the real domain.
export const prerender = true;

const STATIC_PATHS = ['/', '/products', '/portfolio', '/services', '/blog', '/contact'];

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site, url }) => {
  const origin = (site?.origin || new URL(url).origin).replace(/\/$/, '');

  type Entry = { loc: string; lastmod?: string; priority?: string };
  const entries: Entry[] = STATIC_PATHS.map((p) => ({
    loc: origin + p,
    priority: p === '/' ? '1.0' : '0.8',
  }));

  try {
    const data = await wpQuery({
      query: `
        query SitemapData {
          productCategories(first: 100, where: { hideEmpty: false }) { nodes { slug } }
          products(first: 500) { nodes { slug modified productCategories { nodes { slug } } } }
          portfolios(first: 500) { nodes { slug modified } }
          posts(first: 500) { nodes { slug modified } }
        }
      `,
    });

    const lastmod = (m?: string) => (m ? String(m).slice(0, 10) : undefined);

    for (const c of data?.productCategories?.nodes || []) {
      if (c?.slug) entries.push({ loc: `${origin}/products/${c.slug}`, priority: '0.7' });
    }
    for (const p of data?.products?.nodes || []) {
      if (p?.slug) entries.push({ loc: `${origin}/products/${p.slug}`, lastmod: lastmod(p.modified), priority: '0.6' });
    }
    for (const p of data?.portfolios?.nodes || []) {
      if (p?.slug) entries.push({ loc: `${origin}/portfolio/${p.slug}`, lastmod: lastmod(p.modified), priority: '0.6' });
    }
    for (const p of data?.posts?.nodes || []) {
      if (p?.slug) entries.push({ loc: `${origin}/blog/${p.slug}`, lastmod: lastmod(p.modified), priority: '0.6' });
    }
  } catch (e) {
    console.warn('[sitemap] WordPress unavailable — emitting static routes only.', e);
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url>\n    <loc>${xmlEscape(e.loc)}</loc>\n` +
          (e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : '') +
          (e.priority ? `    <priority>${e.priority}</priority>\n` : '') +
          `  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
};
