import { FastifyInstance } from 'fastify';

export const productRoutes = async (app: FastifyInstance) => {
  app.get('/products', async (request, reply) => {
    return reply.status(200).send([]);
  });
};