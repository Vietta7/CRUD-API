import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../app';

const app = buildApp();

beforeEach(async () => {
  await app.ready();
});

describe('Products API', () => {
  let createdId: string;

  it('GET /api/products returns empty array', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
  });

  it('POST /api/products creates a new product', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: {
        name: 'Test Laptop',
        description: 'A test laptop',
        price: 999.99,
        category: 'electronics',
        inStock: true,
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      name: 'Test Laptop',
      description: 'A test laptop',
      price: 999.99,
      category: 'electronics',
      inStock: true,
    });
    expect(body.id).toBeDefined();
    createdId = body.id;
  });

  it('GET /api/products/:id returns the created product', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: {
        name: 'Test Laptop',
        description: 'A test laptop',
        price: 999.99,
        category: 'electronics',
        inStock: true,
      },
    });
    const created = JSON.parse(createResponse.body);

    const response = await app.inject({
      method: 'GET',
      url: `/api/products/${created.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ id: created.id });
  });

  it('PUT /api/products/:id updates the product', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: {
        name: 'Old Name',
        description: 'Old desc',
        price: 10,
        category: 'books',
        inStock: false,
      },
    });
    const created = JSON.parse(createResponse.body);

    const response = await app.inject({
      method: 'PUT',
      url: `/api/products/${created.id}`,
      payload: {
        name: 'New Name',
        description: 'New desc',
        price: 20,
        category: 'books',
        inStock: true,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.name).toBe('New Name');
    expect(body.id).toBe(created.id);
  });

  it('DELETE /api/products/:id deletes the product', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: {
        name: 'To Delete',
        description: 'Will be deleted',
        price: 5,
        category: 'clothing',
        inStock: true,
      },
    });
    const created = JSON.parse(createResponse.body);

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/products/${created.id}`,
    });

    expect(response.statusCode).toBe(204);
  });

  it('GET /api/products/:id returns 404 after deletion', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: {
        name: 'To Delete',
        description: 'Will be deleted',
        price: 5,
        category: 'clothing',
        inStock: true,
      },
    });
    const created = JSON.parse(createResponse.body);

    await app.inject({
      method: 'DELETE',
      url: `/api/products/${created.id}`,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/products/${created.id}`,
    });

    expect(response.statusCode).toBe(404);
  });
});