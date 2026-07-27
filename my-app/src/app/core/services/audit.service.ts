import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockApiService } from './mock-api.service';
import { AuditLog } from '../models/index';

@Injectable({ providedIn: 'root' })
export class AuditService {
  constructor(private api: MockApiService) {}

  getAll(): Observable<AuditLog[]> { return this.api.getAuditLogs(); }
}
