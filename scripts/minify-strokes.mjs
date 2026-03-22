#!/usr/bin/env node
/**
 * Minify stroke JSON files by stripping whitespace.
 * Reduces raw size by ~50% with zero data loss.
 *
 * Usage: node scripts/minify-strokes.mjs [directory]
 * Default directory: public/stroke-json
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const dir = process.argv[2] || 'public/stroke-json';

const files = (await readdir(dir)).filter(f => f.endsWith('.json'));
console.log(`Minifying ${files.length} stroke files in ${dir}...`);

let savedBytes = 0;
let processed = 0;

for (const file of files) {
  const path = join(dir, file);
  const raw = await readFile(path, 'utf8');
  const minified = JSON.stringify(JSON.parse(raw));
  if (minified.length < raw.length) {
    savedBytes += raw.length - minified.length;
    await writeFile(path, minified);
  }
  processed++;
  if (processed % 1000 === 0) {
    console.log(`  ${processed}/${files.length}...`);
  }
}

console.log(`Done. ${processed} files, saved ${(savedBytes / 1048576).toFixed(1)} MB`);
