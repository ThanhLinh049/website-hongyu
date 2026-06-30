import type { APIRoute } from 'astro';
import { WP_UPLOADS_ORIGIN } from '../../lib/api';

// Runtime endpoint (not prerendered): streams WordPress upload bytes through the
// frontend's own origin so the browser never sees the WP/CMS domain, and every
// image is cached hard at the edge. Maps /media/<path> -> <WP>/wp-content/uploads/<path>.
export const prerender = false;

// Minimal content-type fallback by extension (upstream usually sets it anyway).
const TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', ico: 'image/x-icon',
  mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf',
  woff: 'font/woff', woff2: 'font/woff2',
};

export const GET: APIRoute = async ({ params }) => {
  const path = (params.path || '').replace(/^\/+/, '');

  // Guard against path traversal and an unconfigured origin.
  if (!path || path.includes('..') || !WP_UPLOADS_ORIGIN) {
    return new Response('Not found', { status: 404 });
  }

  const upstream = `${WP_UPLOADS_ORIGIN}/wp-content/uploads/${path}`;

  let res: Response;
  try {
    res = await fetch(upstream);
  } catch {
    return new Response('Bad gateway', { status: 502 });
  }
  if (!res.ok || !res.body) {
    return new Response('Not found', { status: res.status === 200 ? 404 : res.status });
  }

  const ext = path.split('.').pop()?.toLowerCase() || '';
  const headers = new Headers();
  headers.set('Content-Type', res.headers.get('Content-Type') || TYPES[ext] || 'application/octet-stream');
  const len = res.headers.get('Content-Length');
  if (len) headers.set('Content-Length', len);
  // Immutable: WordPress writes a new filename when a media file changes.
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(res.body, { status: 200, headers });
};
