import type { FastifyPluginAsync } from 'fastify';

const VERSION = '0.1.0';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => ({
    ok: true,
    timestamp: new Date().toISOString(),
    version: VERSION,
  }));
};
