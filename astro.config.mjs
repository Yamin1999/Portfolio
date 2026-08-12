// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Served from https://yamin1999.github.io/Portfolio/ — a project repo, so the
// site lives on a subpath and `base` must be set. Every internal link goes
// through url() in src/lib/url.ts so it picks the prefix up automatically.
//
// Moving to a custom domain later: set `site` to the domain and `base` to '/',
// and everything follows.
export default defineConfig({
  site: 'https://yamin1999.github.io',
  base: '/Portfolio',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
});
