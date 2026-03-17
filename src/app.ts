import Fastify from 'fastify';
import { productRoutes } from './routes/products';

export const buildApp = () => {
  const app = Fastify({ logger: true });

  app.register(productRoutes, { prefix: '/api' });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(500).send({
      statusCode: 500,
      message: 'Internal server error',
    });
  });

  return app;
};