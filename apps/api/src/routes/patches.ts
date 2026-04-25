import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';

export const patchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/patches/current', async (request, reply) => {
    const rows = await db
      .select()
      .from(schema.patches)
      .where(eq(schema.patches.isCurrent, true))
      .limit(1);

    if (rows.length === 0) return reply.code(404).send({ error: 'No current patch found' });
    const patch = rows[0]!;
    return { version: patch.version, releasedAt: patch.releasedAt };
  });
};
