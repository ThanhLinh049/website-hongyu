import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
// Hybrid: pages are static by default; products/portfolio opt into SSR
// (export const prerender = false) so new items appear instantly from WP.
// For Vercel deploy later: swap `node(...)` for `@astrojs/vercel/serverless`.
export default defineConfig({
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    tailwind({
      configFile: './tailwind.config.mjs',
    }),
  ],
});
