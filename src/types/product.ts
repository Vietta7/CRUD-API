export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
}