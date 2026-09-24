/**
 * SKILLUP — apply supabase/schema.sql to the database.
 * Usage:  node --env-file=.env scripts/apply-schema.mjs
 * Requires DATABASE_URL in .env (direct Supabase Postgres connection).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(scriptDir, '..', 'supabase', 'schema.sql'), 'utf8');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Add it to .env (see .env.example).');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
});

try {
  await client.connect();
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  console.log('Schema applied successfully.');
  const tables = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  console.log('Tables in public schema:', tables.rows.map((r) => r.table_name).join(', '));
} catch (err) {
  try {
    await client.query('rollback');
  } catch {
    /* ignore */
  }
  console.error('Failed to apply schema:', err.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}