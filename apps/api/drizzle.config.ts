import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'drizzle-kit';

// Load root .env for drizzle-kit CLI commands (CWD = apps/api when run via pnpm filter)
config({ path: resolve(process.cwd(), '../../.env') });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
