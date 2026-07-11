import type { Config } from 'drizzle-kit';

// Used only for local schema authoring / `drizzle-kit generate`. Requires DATABASE_URL
// (the Supabase Postgres connection string) in your local .env — never committed.
export default {
  schema: './db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
