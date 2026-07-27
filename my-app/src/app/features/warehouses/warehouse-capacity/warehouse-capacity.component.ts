import { Component } from '@angular/core';

interface WarehouseCapacity {
  id: string;
  name: string;
  location: string;
  total: number;
  occupied: number;
  available: number;
  reserved: number;
}

interface ProductStock {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
}

@Component({
  selector: 'app-warehouse-capacity',
  templateUrl: './warehouse-capacity.component.html',
  styleUrls: ['./warehouse-capacity.component.scss']
})
export class WarehouseCapacityComponent {

  selectedWarehouseId = 'WH-001';

  warehouses: WarehouseCapacity[] = [
    { id: 'WH-001', name: 'Central WH-A',     location: 'Dhaka, BD',      total: 10000, occupied: 8800, available: 1200, reserved: 400 },
    { id: 'WH-002', name: 'North Logistics-B', location: 'Chittagong, BD', total: 10000, occupied: 6200, available: 3800, reserved: 250 },
    { id: 'WH-003', name: 'South Hub-D',       location: 'Sylhet, BD',     total: 5000,  occupied: 4750, available: 250,  reserved: 100 },
    { id: 'WH-004', name: 'West Transit-C',    location: 'Rajshahi, BD',   total: 5000,  occupied: 750,  available: 4250, reserved: 0   },
    { id: 'WH-005', name: 'East Port-E',       location: 'Khulna, BD',     total: 8000,  occupied: 5760, available: 2240, reserved: 320 },
  ];

  productStockMap: Record<string, ProductStock[]> = {
    'WH-001': [
      { productId: 'PRD-1003', productName: 'Safety Helmet Pro',      category: 'Safety',        quantity: 2800 },
      { productId: 'PRD-1008', productName: 'Steel Pipe 2 inch',      category: 'Raw Materials', quantity: 2100 },
      { productId: 'PRD-1010', productName: 'Thermal Label Roll',     category: 'Packaging',     quantity: 1850 },
      { productId: 'PRD-1001', productName: 'Industrial Pump Filter', category: 'Industrial',    quantity: 1200 },
      { productId: 'PRD-1006', productName: 'Safety Gloves (L)',      category: 'Safety',        quantity: 850  },
    ],
    'WH-002': [
      { productId: 'PRD-1008', productName: 'Steel Pipe 2 inch',      category: 'Raw Materials', quantity: 3200 },
      { productId: 'PRD-1012', productName: 'Copper Wire 1.5mm',      category: 'Raw Materials', quantity: 1600 },
      { productId: 'PRD-1004', productName: 'Hydraulic Seal Kit',     category: 'Industrial',    quantity: 900  },
      { productId: 'PRD-1005', productName: 'Packing Foam Roll',      category: 'Packaging',     quantity: 500  },
    ],
    'WH-003': [
      { productId: 'PRD-1003', productName: 'Safety Helmet Pro',      category: 'Safety',        quantity: 2200 },
      { productId: 'PRD-1007', productName: 'Electric Drill 18V',     category: 'Tools',         quantity: 1400 },
      { productId: 'PRD-1011', productName: 'Air Compressor 50L',     category: 'Tools',         quantity: 1150 },
    ],
    'WH-004': [
      { productId: 'PRD-1009', productName: 'Circuit Breaker 20A',    category: 'Electronics',   quantity: 750  },
    ],
    'WH-005': [
      { productId: 'PRD-1008', productName: 'Steel Pipe 2 inch',      category: 'Raw Materials', quantity: 2400 },
      { productId: 'PRD-1003', productName: 'Safety Helmet Pro',      category: 'Safety',        quantity: 1800 },
      { productId: 'PRD-1009', productName: 'Circuit Breaker 20A',    category: 'Electronics',   quantity: 960  },
      { productId: 'PRD-1006', productName: 'Safety Gloves (L)',      category: 'Safety',        quantity: 600  },
    ],
  };

  get selectedWarehouse(): WarehouseCapacity {
    return this.warehouses.find(w => w.id === this.selectedWarehouseId)!;
  }

  get selectedProducts(): ProductStock[] {
    return this.productStockMap[this.selectedWarehouseId] || [];
  }

  utilPct(w: WarehouseCapacity): number {
    return Math.round((w.occupied / w.total) * 100);
  }

  availPct(w: WarehouseCapacity): number {
    return Math.round((w.available / w.total) * 100);
  }

  productPct(qty: number): number {
    return Math.round((qty / this.selectedWarehouse.total) * 100);
  }

  colorClass(w: WarehouseCapacity): string {
    const p = this.utilPct(w);
    if (p > 90) return 'gauge-critical';
    if (p >= 70) return 'gauge-warning';
    return 'gauge-ok';
  }

  colorLabel(w: WarehouseCapacity): string {
    const p = this.utilPct(w);
    if (p > 90) return 'Critical';
    if (p >= 70) return 'Near Capacity';
    return 'Healthy';
  }

  // SVG circle gauge helpers
  gaugeCircumference = 2 * Math.PI * 36; // r=36

  gaugeDash(w: WarehouseCapacity): number {
    return (this.utilPct(w) / 100) * this.gaugeCircumference;
  }

  selectWarehouse(id: string): void {
    this.selectedWarehouseId = id;
  }

  categoryColor(cat: string): string {
    const map: Record<string, string> = {
      'Electronics':   '#3b82f6', 'Industrial':    '#f59e0b',
      'Packaging':     '#8b5cf6', 'Safety':        '#ef4444',
      'Tools':         '#06b6d4', 'Raw Materials': '#10b981'
    };
    return map[cat] || '#94a3b8';
  }

  // Total of all warehouses combined
  get grandTotal():    number { return this.warehouses.reduce((s, w) => s + w.total, 0); }
  get grandOccupied(): number { return this.warehouses.reduce((s, w) => s + w.occupied, 0); }
  get grandAvailable():number { return this.warehouses.reduce((s, w) => s + w.available, 0); }
  get overallPct():    number { return Math.round((this.grandOccupied / this.grandTotal) * 100); }
}
