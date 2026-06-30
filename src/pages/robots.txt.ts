import type { APIRoute } from 'astro';

// Dynamic robots.txt so the Sitemap line always points at the current origin
// (configured `site` on deploy, else the request origin).
export const prerender = false;

export const GET: APIRoute = ({ site, url }) => {
  const origin = (site?.origin || new URL(url).origin).replace(/\/$/, '');
  const body = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
};
