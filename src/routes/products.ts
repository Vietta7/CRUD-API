import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '../db/inMemoryDb';
import { CreateProductDto } from '../types/product';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

const isValidBody = (body: CreateProductDto): boolean => {
  const { name, description, price, category, inStock } = body;
  return (
    typeof name === 'string' &&
    typeof description === 'string' &&
    typeof price === 'number' &&
    price > 0 &&
    typeof category === 'string' &&
    typeof inStock === 'boolean'
  );
};

const syncToMaster = async () => {
  if (process.send) {
    const products = await db.getAll();
    process.send({ type: 'sync', products });
  }
};

export const productRoutes = async (app: FastifyInstance) => {
  app.get('/products', async (request, reply) => {
    const products = await db.getAll();
    return reply.status(200).send(products);
  });

  app.get<{ Params: { productId: string } }>(
    '/products/:productId',
    async (request, reply) => {
      const { productId } = request.params;
      if (!isValidUUID(productId)) {
        return reply.status(400).send({ statusCode: 400, message: 'Invalid productId: must be a valid UUID' });
      }
      const product = await db.getById(productId);
      if (!product) {
        return reply.status(404).send({ statusCode: 404, message: `Product with id ${productId} not found` });
      }
      return reply.status(200).send(product);
    }
  );

  app.post<{ Body: CreateProductDto }>('/products', async (request, reply) => {
    const body = request.body;
    if (!body || !isValidBody(body)) {
      return reply.status(400).send({
        statusCode: 400,
        message: 'Request body must contain: name (string), description (string), price (number > 0), category (string), inStock (boolean)',
      });
    }
    const newProduct = {
      id: randomUUID(),
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category,
      inStock: body.inStock,
    };
    const created = await db.create(newProduct);
    await syncToMaster();
    return reply.status(201).send(created);
  });

  app.put<{ Params: { productId: string }; Body: CreateProductDto }>(
    '/products/:productId',
    async (request, reply) => {
      const { productId } = request.params;
      if (!isValidUUID(productId)) {
        return reply.status(400).send({ statusCode: 400, message: 'Invalid productId: must be a valid UUID' });
      }
      const body = request.body;
      if (!body || !isValidBody(body)) {
        return reply.status(400).send({
          statusCode: 400,
          message: 'Request body must contain: name (string), description (string), price (number > 0), category (string), inStock (boolean)',
        });
      }
      const updated = await db.update(productId, body);
      if (!updated) {
        return reply.status(404).send({ statusCode: 404, message: `Product with id ${productId} not found` });
      }
      await syncToMaster();
      return reply.status(200).send(updated);
    }
  );

  app.delete<{ Params: { productId: string } }>(
    '/products/:productId',
    async (request, reply) => {
      const { productId } = request.params;
      if (!isValidUUID(productId)) {
        return reply.status(400).send({ statusCode: 400, message: 'Invalid productId: must be a valid UUID' });
      }
      const deleted = await db.delete(productId);
      if (!deleted) {
        return reply.status(404).send({ statusCode: 404, message: `Product with id ${productId} not found` });
      }
      await syncToMaster();
      return reply.status(204).send();
    }
  );
};