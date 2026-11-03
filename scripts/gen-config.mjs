#!/usr/bin/env node
// Generates js/config.js from .env (client-safe values only).
// Run: node scripts/gen-config.mjs   — or double-click run.bat.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(root, '.env');

if (!existsSync(envPath)) {
  console.error('✗ .env not found. Copy .env.example to .env and fill in your values first.');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      if (i < 0) return null;
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
    .filter(Boolean)
);

const { SUPABASE_URL, SUPABASE_KEY } = env;
for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_KEY })) {
  if (!v || v.startsWith('YOUR-')) {
    console.error(`✗ ${k} is missing or still a placeholder in .env`);
    process.exit(1);
  }
}

const out = `// GENERATED from .env by scripts/gen-config.mjs — DO NOT EDIT, DO NOT COMMIT.
// The publishable key is designed for client-side code; RLS guards the data.
// NEVER put the service_role / secret key here or in .env.
export const SUPABASE_URL = '${SUPABASE_URL}';
export const SUPABASE_KEY = '${SUPABASE_KEY}';
`;
writeFileSync(join(root, 'js', 'config.js'), out, 'utf8');
console.log('✓ js/config.js generated from .env');
