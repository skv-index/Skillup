/**
 * SKILLUP — apply supabase/schema.sql via the Supabase Management API (HTTPS).
 * Works even when direct Postgres is unreachable (IPv6-only DB hosts).
 *
 * Usage:  node --env-file=.env scripts/apply-schema-mgmt.mjs
 * Requires in .env:
 *   SUPABASE_PROJECT_REF=...            (project ref, e.g. jplctoeaytltagohaboc)
 *   SUPABASE_PAT=sbp_...                (personal access token from https://supabase.com/dashboard/account/tokens)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(scriptDir, '..', 'supabase', 'schema.sql'), 'utf8');

const ref = process.env.SUPABASE_PROJECT_REF;
const pat = process.env.SUPABASE_PAT;
if (!ref || !pat) {
  console.error('SUPABASE_PROJECT_REF and/or SUPABASE_PAT are not set.');
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${pat}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const text = await res.text();
if (res.ok) {
  console.log('Schema applied successfully via Management API.');
} else {
  console.error(`Schema apply failed (${res.status}):`, text.slice(0, 2000));
  process.exit(1);
}