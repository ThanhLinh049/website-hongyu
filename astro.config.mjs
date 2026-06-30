import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
// Hybrid: pages are static by default; products/portfolio/blog/services/contact
// opt into SSR (export const prerender = false) so new items appear instantly from WP.
// Deployed on Vercel via @astrojs/vercel (serverless functions for the SSR routes).
export default defineConfig({
  // Public site origin — used for canonical / Open Graph absolute URLs. Set
  // PUBLIC_SITE_URL on deploy (e.g. https://your-frontend.com); falls back to
  // the request origin when unset (fine for local dev).
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: 'hybrid',
  adapter: vercel({
    // ISR (Incremental Static Regeneration): cache each SSR page at Vercel's
    // edge and only re-query WordPress when the cache expires, instead of on
    // every request. Big speed win + far less load on WP. Content edits appear
    // within ~`expiration` seconds. Raise it for less WP load, lower it for
    // fresher content. (Local `astro dev` is unaffected — always live.)
    isr: {
      expiration: 60,
    },
  }),
  integrations: [
    tailwind({
      configFile: './tailwind.config.mjs',
    }),
  ],
});
