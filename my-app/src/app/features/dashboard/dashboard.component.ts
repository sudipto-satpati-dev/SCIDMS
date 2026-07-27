import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/index';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  loading = true;
  stats!: DashboardStats;

  // Expose individual arrays with fallbacks so the template
  // never crashes during the brief loading window.
  get orderStatusData()  { return this.stats?.orderStatusData  ?? []; }
  get shipmentPerfData() { return this.stats?.shipmentPerfData ?? []; }
  get warehouseData()    { return this.stats?.warehouseData    ?? []; }
  get recentOrders()     { return this.stats?.recentOrders     ?? []; }
  get lowStockItems()    { return this.stats?.lowStockItems    ?? []; }

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe(data => {
      this.stats   = data;
      this.loading = false;
    });
  }
}
