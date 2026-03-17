import { Product } from '../types/product';

let products: Product[] = [];

export const db = {
  getAll: async (): Promise<Product[]> => {
    return products;
  },

  getById: async (id: string): Promise<Product | undefined> => {
    return products.find((p) => p.id === id);
  },

  create: async (product: Product): Promise<Product> => {
    products.push(product);
    return product;
  },

  update: async (id: string, data: Partial<Product>): Promise<Product | undefined> => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    products[index] = { ...products[index], ...data };
    return products[index];
  },

  delete: async (id: string): Promise<boolean> => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    return true;
  },
};