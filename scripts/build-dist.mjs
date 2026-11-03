#!/usr/bin/env node
// Stages a clean deploy folder in dist/ (runtime files only + _headers).
// Run: node scripts/build-dist.mjs   — requires js/config.js (run gen-config first).
import { rmSync, mkdirSync, cpSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

if (!existsSync(join(root, 'js', 'config.js'))) {
  console.error('✗ js/config.js missing — run: node scripts/gen-config.mjs');
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'index.html'), join(dist, 'index.html'));
cpSync(join(root, 'js'), join(dist, 'js'), { recursive: true });
cpSync(join(root, 'vendor'), join(dist, 'vendor'), { recursive: true });

writeFileSync(join(dist, '_headers'), `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin

/vendor/*
  Cache-Control: public, max-age=31536000, immutable

/js/*
  Cache-Control: public, max-age=3600
`, 'ascii');

let files = 0, bytes = 0;
const walk = d => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p); else { files++; bytes += statSync(p).size; }
  }
};
walk(dist);
console.log(`✓ dist/ staged — ${files} files, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
