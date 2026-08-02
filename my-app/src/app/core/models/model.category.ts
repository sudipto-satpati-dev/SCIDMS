export interface Category {
  id: number;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface CategoryApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
