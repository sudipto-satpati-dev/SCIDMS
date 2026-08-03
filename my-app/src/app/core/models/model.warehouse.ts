export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  totalCapacity: number;
  occupiedCapacity: number;
  availableCapacity: number;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
  managerId?: number | null;
  managerUsername?: string | null;
  managerEmail?: string | null;
}

export interface CreateWarehouseRequest {
  name: string;
  location: string;
  totalCapacity: number;
}

export type UpdateWarehouseRequest = Partial<CreateWarehouseRequest>;

export interface ToggleWarehouseStatusRequest {
  status: WarehouseStatus;
}

export interface AssignWarehouseManagerRequest {
  managerId: number;
}

export interface WarehouseListParams {
  search?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface WarehouseListApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    warehouses: Warehouse[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface SingleWarehouseApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: Warehouse;
}

export interface WarehouseListResult {
  warehouses: Warehouse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}