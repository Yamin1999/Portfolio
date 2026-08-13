#!/usr/bin/env node
/**
 * Compresses images uploaded through the CMS.
 *
 * Runs after the build, on dist/ only - the originals in public/uploads stay
 * untouched in git, so nothing is lost and re-running is always safe. Files keep
 * their name and extension so every reference in the built HTML still resolves.
 *
 * This exists because uploading from the CMS is the one path where a 780 KB
 * screenshot can land on the site without anyone thinking about it.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const DIST_UPLOADS = new URL('../dist/uploads', import.meta.url).pathname;
const MAX_WIDTH = 1600;
const RESIZABLE = new Set(['.png', '.jpg', '.jpeg', '.webp']);

if (!existsSync(DIST_UPLOADS)) {
  console.log('\nNo dist/uploads - nothing to optimize.\n');
  process.exit(0);
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
let savedTotal = 0;

console.log('\nOptimizing uploads\n');

for (const name of readdirSync(DIST_UPLOADS)) {
  const ext = extname(name).toLowerCase();
  if (!RESIZABLE.has(ext)) continue;

  const path = join(DIST_UPLOADS, name);
  const before = statSync(path).size;

  try {
    const image = sharp(path, { failOn: 'none' });
    const meta = await image.metadata();

    let pipeline = image;
    if (meta.width && meta.width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }

    if (ext === '.png') {
      pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: 82 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 82 });
    } else {
      pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
    }

    // sharp cannot write to the file it is reading, so buffer then replace.
    const buffer = await pipeline.toBuffer();

    if (buffer.length < before) {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(path, buffer);
      savedTotal += before - buffer.length;
      console.log(
        `  ${name}\n    ${kb(before)} → ${kb(buffer.length)}  (−${Math.round((1 - buffer.length / before) * 100)}%)`,
      );
    } else {
      console.log(`  ${name}\n    ${kb(before)} - already optimal, left alone`);
    }
  } catch (error) {
    console.log(`  ${name}\n    skipped: ${error.message}`);
  }
}

console.log(
  savedTotal > 0 ? `\nSaved ${kb(savedTotal)} total\n` : '\nNothing to save\n',
);
