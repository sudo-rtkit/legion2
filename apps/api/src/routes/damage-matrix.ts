import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';

export const damageMatrixRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/damage-matrix', async () => {
    return db.select().from(schema.damageMatrix).orderBy(schema.damageMatrix.attackType);
  });
};
