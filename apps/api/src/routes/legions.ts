import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';

export const legionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/legions', async () => {
    return db.select().from(schema.legions);
  });

  fastify.get('/api/legions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const rows = await db.select().from(schema.legions).where(eq(schema.legions.id, id));
    if (rows.length === 0) return reply.code(404).send({ error: 'Legion not found' });
    return rows[0];
  });
};
