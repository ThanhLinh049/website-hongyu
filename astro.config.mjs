import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
// Hybrid: pages are static by default; products/portfolio/blog/services/contact
// opt into SSR (export const prerender = false) so new items appear instantly from WP.
// Deployed on Vercel via @astrojs/vercel (serverless functions for the SSR routes).
export default defineConfig({
  output: 'hybrid',
  adapter: vercel(),
  integrations: [
    tailwind({
      configFile: './tailwind.config.mjs',
    }),
  ],
});
