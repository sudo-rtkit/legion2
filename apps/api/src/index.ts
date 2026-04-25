import { buildApp } from './app.js';
import { sql } from './db/client.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = buildApp();

app.addHook('onClose', async () => {
  await sql.end();
});

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
