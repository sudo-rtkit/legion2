import type { FastifyPluginAsync } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';

const querySchema = z.object({
  legion: z.string().optional(),
  class: z.string().optional(),
});

export const unitRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/units', async (request, reply) => {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const { legion, class: unitClass } = parsed.data;

    const conditions = [
      legion ? eq(schema.units.legionId, legion) : undefined,
      unitClass ? eq(schema.units.unitClass, unitClass) : undefined,
    ].filter((c) => c !== undefined);

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(schema.units)
            .where(and(...conditions))
        : await db.select().from(schema.units);

    return rows;
  });

  fastify.get('/api/units/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const rows = await db.select().from(schema.units).where(eq(schema.units.id, id));
    if (rows.length === 0) return reply.code(404).send({ error: 'Unit not found' });
    return rows[0];
  });
};
