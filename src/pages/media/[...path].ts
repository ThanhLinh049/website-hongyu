import type { APIRoute } from 'astro';
import { WP_UPLOADS_ORIGIN } from '../../lib/api';

// Runtime endpoint (not prerendered): streams WordPress upload bytes through the
// frontend's own origin so the browser never sees the WP/CMS domain, and every
// image is cached hard at the edge. Maps /media/<path> -> <WP>/wp-content/uploads/<path>.
//
// Optimisation: raster images (JPEG/PNG) are transcoded to WebP on the fly when the
// browser advertises WebP support (Accept header) and the result is smaller. This
// typically shrinks PNGs ~60-70% and JPEGs ~30% with no markup changes. sharp is
// loaded dynamically and, if unavailable at runtime, the original bytes are streamed
// unchanged — so this degrades gracefully and never breaks the response.
export const prerender = false;

// Minimal content-type fallback by extension (upstream usually sets it anyway).
const TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', ico: 'image/x-icon',
  mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf',
  woff: 'font/woff', woff2: 'font/woff2',
};

const CACHE = 'public, max-age=31536000, immutable';
const MAX_WIDTH = 1600; // safety cap so oversized uploads don't ship at full size

export const GET: APIRoute = async ({ params, request }) => {
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
  const upstreamType = res.headers.get('Content-Type') || TYPES[ext] || 'application/octet-stream';

  // Try WebP transcoding for JPEG/PNG when the client supports it.
  const accept = request.headers.get('accept') || '';
  const isRaster = ext === 'jpg' || ext === 'jpeg' || ext === 'png'
    || upstreamType === 'image/jpeg' || upstreamType === 'image/png';

  if (isRaster && accept.includes('image/webp')) {
    const input = Buffer.from(await res.arrayBuffer());
    try {
      const sharp = (await import('sharp')).default;
      const out = await sharp(input)
        .rotate() // respect EXIF orientation
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      // Only serve WebP when it actually saves bytes.
      if (out.length < input.length) {
        return new Response(out, {
          status: 200,
          headers: { 'Content-Type': 'image/webp', 'Content-Length': String(out.length), 'Cache-Control': CACHE, 'Vary': 'Accept' },
        });
      }
    } catch {
      // sharp unavailable or failed — fall through to the original bytes.
    }
    return new Response(input, {
      status: 200,
      headers: { 'Content-Type': upstreamType, 'Content-Length': String(input.length), 'Cache-Control': CACHE, 'Vary': 'Accept' },
    });
  }

  // Non-raster (svg/gif/webp/video/pdf…) or no WebP support: stream unchanged.
  const headers = new Headers();
  headers.set('Content-Type', upstreamType);
  const len = res.headers.get('Content-Length');
  if (len) headers.set('Content-Length', len);
  headers.set('Cache-Control', CACHE);
  headers.set('Vary', 'Accept');
  return new Response(res.body, { status: 200, headers });
};
