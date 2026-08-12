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
robots.includes('Disallow: /admin')
  ? pass('robots.txt disallows /admin')
  : fail('robots.txt does not disallow /admin');

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

/* 4 — performance budget --------------------------------------------------- */

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

/* 5 — the CV must actually be downloadable --------------------------------- */

const resumeDir = join(DIST, 'resume');
existsSync(resumeDir) && readdirSync(resumeDir).some((f) => f.endsWith('.pdf'))
  ? pass('CV PDF present in dist/resume')
  : fail('no CV PDF found in dist/resume');

/* ------------------------------------------------------------------------- */

console.log(
  `\n${checks - failures}/${checks} checks passed${failures ? ` — ${failures} FAILED` : ''}\n`,
);
process.exit(failures ? 1 : 0);
