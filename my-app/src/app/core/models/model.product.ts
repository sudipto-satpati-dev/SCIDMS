export type ProductCategory =
  | 'Electronics'
  | 'Industrial'
  | 'Packaging'
  | 'Safety'
  | 'Tools'
  | 'Raw Materials';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unitPrice: number;
  availableQty: number;
  threshold: number;
  status: 'Active' | 'Inactive';
}