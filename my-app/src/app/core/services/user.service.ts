import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockApiService } from './mock-api.service';
import { User } from '../models/index';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: MockApiService) {}

  getAll(): Observable<User[]>                                       { return this.api.getUsers(); }
  create(data: Omit<User, 'id' | 'createdAt'>): Observable<User>    { return this.api.createUser(data); }
  update(id: string, data: Partial<User>): Observable<User>         { return this.api.updateUser(id, data); }
  toggleStatus(id: string): Observable<User>                        { return this.api.toggleUserStatus(id); }
}
