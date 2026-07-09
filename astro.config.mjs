import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

// Astro does NOT load .env into process.env for this config file, so read it
// explicitly (prefix "" = all vars). Real process.env still wins, so Vercel's
// dashboard-set PUBLIC_SITE_URL takes precedence on deploy; local builds fall
// back to the value in .env.
const ENV = loadEnv(process.env.NODE_ENV || '', process.cwd(), '');
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || ENV.PUBLIC_SITE_URL || undefined;

// https://astro.build/config
// Publish-on-deploy model: ALL content pages are prerendered to static HTML at
// build time (each dynamic route lists its pages via getStaticPaths). Editing
// content in wp-admin does NOT change the live site — the frontend only reads
// WordPress during a build. A build is triggered manually (the "Deploy" button
// in wp-admin → Vercel Deploy Hook), so N edits + 1 click = exactly 1 deploy.
// Only the form endpoints (/api/*) and the image proxy (/media) stay server-
// rendered — runtime concerns, unrelated to content freshness.
export default defineConfig({
  // Public site origin — used for canonical / Open Graph / sitemap absolute URLs.
  // MUST be set on deploy (PUBLIC_SITE_URL, e.g. https://hongyuemblem.com) so the
  // prerendered sitemap/robots and OG tags carry the real domain.
  site: PUBLIC_SITE_URL,
  output: 'hybrid',
  adapter: vercel(),
  integrations: [
    tailwind({
      configFile: './tailwind.config.mjs',
    }),
  ],
});
