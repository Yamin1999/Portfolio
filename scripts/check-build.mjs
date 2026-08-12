#!/usr/bin/env node
/**
 * Post-build checks. Run with `npm run verify` (which builds first).
 *
 * These are the failures that actually hurt: an unpublished draft leaking into
 * the built site, a published page silently missing, the admin panel getting
 * indexed, or a page quietly growing past the performance budget.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const HTML_GZIP_BUDGET = 25 * 1024; // §12 of the build spec

let failures = 0;
let checks = 0;

const pass = (msg) => {
  checks += 1;
  console.log(`  ok    ${msg}`);
};
const fail = (msg) => {
  checks += 1;
  failures += 1;
  console.log(`  FAIL  ${msg}`);
};

/** Minimal frontmatter reader — enough for the fields we gate on. */
function frontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return data;
}

function collect(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({
      slug: name.replace(/\.md$/, ''),
      file: join(dir, name),
      data: frontmatter(join(dir, name)),
    }));
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

console.log('\nBuild checks\n');

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.\n');
  process.exit(1);
}

const distFiles = walk(DIST);
const htmlFiles = distFiles.filter((f) => f.endsWith('.html'));
const allHtml = htmlFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

/* 1 & 2 — publishing gate ------------------------------------------------- */

for (const [collection, urlBase] of [
  ['projects', 'projects'],
  ['posts', 'blog'],
]) {
  for (const entry of collect(join(ROOT, 'src', 'content', collection))) {
    const page = join(DIST, urlBase, entry.slug, 'index.html');
    const isPublished = entry.data.published === 'true';
    const isFuture =
      entry.data.publishedAt && new Date(entry.data.publishedAt) > new Date();
    const shouldExist = isPublished && !isFuture;

    if (shouldExist && !existsSync(page)) {
      fail(`${collection}/${entry.slug} is published but has no page`);
    } else if (!shouldExist && existsSync(page)) {
      fail(`${collection}/${entry.slug} is a draft but a page was generated`);
    } else if (!shouldExist && entry.data.title && allHtml.includes(entry.data.title)) {
      fail(`${collection}/${entry.slug} is a draft but its title leaked into the site`);
    } else {
      pass(
        `${collection}/${entry.slug} — ${shouldExist ? 'published, page present' : 'draft, correctly absent'}`,
      );
    }
  }
}

/* 3 — admin must not be indexed ------------------------------------------- */

const robots = existsSync(join(DIST, 'robots.txt'))
  ? readFileSync(join(DIST, 'robots.txt'), 'utf8')
  : '';
/Disallow:\s*\S*\/admin/.test(robots)
  ? pass('robots.txt disallows the admin path')
  : fail('robots.txt does not disallow the admin path');

const sitemaps = distFiles.filter((f) => f.includes('sitemap') && f.endsWith('.xml'));
const sitemapText = sitemaps.map((f) => readFileSync(f, 'utf8')).join('');
sitemaps.length === 0
  ? fail('no sitemap generated')
  : sitemapText.includes('/admin')
    ? fail('sitemap lists /admin')
    : pass(`sitemap generated (${sitemaps.length} file(s)), no /admin entries`);

const adminHtml = join(DIST, 'admin', 'index.html');
existsSync(adminHtml) && readFileSync(adminHtml, 'utf8').includes('noindex')
  ? pass('admin page carries a noindex robots tag')
  : fail('admin page missing or has no noindex tag');

/* 4 — every internal link carries the base prefix --------------------------- */

// On a subpath deploy a literal href="/projects" silently 404s. This catches any
// link that skipped the url() helper.
const BASE = (readFileSync(join(ROOT, 'astro.config.mjs'), 'utf8').match(
  /base:\s*'([^']+)'/,
) ?? [])[1];

if (!BASE || BASE === '/') {
  pass('site is served from the root — no base prefix needed');
} else {
  const knownRoutes = ['projects', 'blog', 'about', 'experience', 'contact', 'resume'];
  const offenders = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="\/([a-zA-Z0-9_-]+)/g)) {
      if (knownRoutes.includes(m[1]) && !html.includes(`"${BASE}/${m[1]}`)) {
        offenders.push(`${relative(DIST, file)} → /${m[1]}`);
      }
    }
  }
  offenders.length === 0
    ? pass(`all internal links carry the '${BASE}' base prefix`)
    : [...new Set(offenders)]
        .slice(0, 5)
        .forEach((o) => fail(`link missing base prefix: ${o}`));
}

/* 5 — performance budget --------------------------------------------------- */

const oversized = htmlFiles
  .map((f) => ({ f, size: gzipSync(readFileSync(f)).length }))
  .filter((x) => x.size > HTML_GZIP_BUDGET);

oversized.length === 0
  ? pass(
      `all ${htmlFiles.length} pages within ${(HTML_GZIP_BUDGET / 1024).toFixed(0)} KB gzipped budget`,
    )
  : oversized.forEach((x) =>
      fail(
        `${relative(DIST, x.f)} is ${(x.size / 1024).toFixed(1)} KB gzipped (budget ${(HTML_GZIP_BUDGET / 1024).toFixed(0)} KB)`,
      ),
    );

/* 5b — theme icons must not carry inline display styles --------------------- */

// An inline style beats every stylesheet rule, so a `style="display:none"` on
// one of these hides it in *both* themes and the toggle renders as an empty box.
const inlineIconStyle = htmlFiles.some((f) => {
  const html = readFileSync(f, 'utf8');
  return /<svg[^>]*class="icon-(sun|moon)"[^>]*style=/.test(html);
});
inlineIconStyle
  ? fail('a theme icon has an inline style — it will be hidden in both themes')
  : pass('theme icons have no inline styles (CSS controls visibility)');

/* 6 — CMS config must not use Decap-only options ---------------------------- */

// Sveltia rejects the whole config on any of these and shows an error screen
// instead of the admin panel — a failure you only see by opening /admin.
const cmsConfigPath = join(DIST, 'admin', 'config.yml');
if (!existsSync(cmsConfigPath)) {
  fail('CMS config.yml missing from the build');
} else {
  const cms = readFileSync(cmsConfigPath, 'utf8');
  const banned = [
    ['allow_multiple', 'use `multiple` instead'],
    ['value_type', 'deprecated on the number widget'],
    ['publish_mode', 'editorial workflow is not implemented'],
    ['use_graphql', 'no longer relevant'],
    ['options_length', 'no longer relevant'],
    ['sortableFields', 'use snake_case `sortable_fields`'],
    ['dateFormat', 'use snake_case `date_format`'],
    ['timeFormat', 'use snake_case `time_format`'],
    ['pickerUtc', 'use snake_case `picker_utc`'],
    ['editorComponents', 'use snake_case `editor_components`'],
  ];
  const hits = banned.filter(([opt]) => new RegExp(`(^|\\s)${opt}\\s*:`, 'm').test(cms));
  hits.length === 0
    ? pass('CMS config uses no Decap-only options')
    : hits.forEach(([opt, why]) => fail(`CMS config uses "${opt}" — ${why}`));

  /^\s*repo:\s*[\w.-]+\/[\w.-]+\s*$/m.test(cms)
    ? pass('CMS backend repo is in owner/repo form')
    : fail('CMS backend repo must be "owner/repo", not a URL');
}

/* 7 — the CV must actually be downloadable --------------------------------- */

const resumeDir = join(DIST, 'resume');
existsSync(resumeDir) && readdirSync(resumeDir).some((f) => f.endsWith('.pdf'))
  ? pass('CV PDF present in dist/resume')
  : fail('no CV PDF found in dist/resume');

/* ------------------------------------------------------------------------- */

console.log(
  `\n${checks - failures}/${checks} checks passed${failures ? ` — ${failures} FAILED` : ''}\n`,
);
process.exit(failures ? 1 : 0);
