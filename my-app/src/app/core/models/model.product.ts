export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  categoryName: string;
  unitPrice: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  categoryId: number;
  unitPrice: number;
}

export type UpdateProductRequest = CreateProductRequest;

export interface ToggleProductStatusRequest {
  status: ProductStatus;
}

export interface ProductListParams {
  search?: string;
  categoryId?: number;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ProductListApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    products: Product[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface CreateProductApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: Product;
}

export type SingleProductApiResponse = CreateProductApiResponse;

export interface ProductListResult {
  products: Product[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}