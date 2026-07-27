import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockApiService } from './mock-api.service';
import { DashboardStats } from '../models/index';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: MockApiService) {}

  getStats(): Observable<DashboardStats> { return this.api.getDashboard(); }
}
