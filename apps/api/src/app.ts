import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { healthRoutes } from './routes/health.js';
import { unitRoutes } from './routes/units.js';
import { waveRoutes } from './routes/waves.js';
import { legionRoutes } from './routes/legions.js';
import { patchRoutes } from './routes/patches.js';
import { damageMatrixRoutes } from './routes/damage-matrix.js';

export function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'production' ? true : { transport: { target: 'pino-pretty' } },
  });

  app.register(cors);
  app.register(helmet);

  app.register(healthRoutes);
  app.register(unitRoutes);
  app.register(waveRoutes);
  app.register(legionRoutes);
  app.register(patchRoutes);
  app.register(damageMatrixRoutes);

  return app;
}
