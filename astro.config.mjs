// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` drives canonical URLs, Open Graph tags and sitemap.xml.
// Served from the root of a <username>.github.io repo, so no `base` is needed.
// If you later buy a domain, change this one line and update robots.txt to match.
export default defineConfig({
  site: 'https://yamin1999.github.io',
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
