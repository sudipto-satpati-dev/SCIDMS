export type WarehouseRegion = 'Dhaka' | 'Chittagong' | 'Sylhet' | 'Rajshahi' | 'Khulna';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  region: WarehouseRegion;
  totalCapacity: number;
  occupiedCapacity: number;
  status: 'Active' | 'Inactive';
  photo: string; // CSS gradient string used as placeholder
}