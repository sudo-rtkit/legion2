import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db, sql } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle');

await migrate(db, { migrationsFolder });
console.info('Migrations applied successfully');
await sql.end();
