import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';

export const waveRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/waves', async () => {
    return db.select().from(schema.waves).orderBy(schema.waves.levelNum);
  });

  fastify.get('/api/waves/:levelNum', async (request, reply) => {
    const raw = (request.params as { levelNum: string }).levelNum;
    const levelNum = parseInt(raw, 10);
    if (Number.isNaN(levelNum))
      return reply.code(400).send({ error: 'levelNum must be an integer' });

    const rows = await db.select().from(schema.waves).where(eq(schema.waves.levelNum, levelNum));
    if (rows.length === 0) return reply.code(404).send({ error: 'Wave not found' });
    return rows[0];
  });
};
