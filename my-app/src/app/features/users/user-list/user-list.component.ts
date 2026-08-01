import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../../../core/models/index';


type Userform = Omit<User, 'id'> & {
  id?: number;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  users: User[] = [];
  loading = true;

  filterRole = '';
  filterStatus = '';
  searchTerm = '';

  totalElements = 0;
  totalPages = 1;
  showFormModal = false;
  showDeleteModal = false;
  selectedUser: Userform | null = null;
  isEditMode = false;
  currentPage = 1;
  pageSize = 10;
  showModalPassword = false;
  modalPassword = '';
  formErrors: Record<string, string> = {};
  saving = false;
  errorMsg = '';

  // Roles available in the page filter (includes ADMIN for searching existing admins)
  roles: UserRole[] = ['ADMIN', 'WAREHOUSE MANAGER', 'SALES EXECUTIVE', 'DISTRIBUTION MANAGER', 'MANAGER'];

  // Roles assignable when creating/editing a user — ADMIN excluded (assigned via backend only)
  assignableRoles: UserRole[] = ['WAREHOUSE MANAGER', 'SALES EXECUTIVE', 'DISTRIBUTION MANAGER', 'MANAGER'];

  private avatarColors: Record<string, string> = {};
  private palette = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#f5f3ff', '#ffedd5'];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAll({
      search: this.searchTerm || undefined,
      role: this.filterRole || undefined,
      status: this.filterStatus || undefined,
      page: this.currentPage - 1,   // API is 0-indexed
      size: this.pageSize,
      sort: 'createdAt,desc',
    }).subscribe({
      next: (result) => {
        this.users = result.users;
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not load users.';
        this.loading = false;
      },
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  avatarBg(username: string): string {
    if (!this.avatarColors[username]) {
      this.avatarColors[username] = this.palette[username.charCodeAt(0) % this.palette.length];
    }
    return this.avatarColors[username];
  }

  get filtered(): User[] {
    return this.users;   // filtering is now server-side
  }

  get pageStart(): number { return this.totalElements === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd(): number { return Math.min(this.currentPage * this.pageSize, this.totalElements); }
  get paged(): User[] { return this.users; }   // server already returns one page
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  get activeCount(): number { return this.users.filter(u => u.status === 'Active').length; }
  get inactiveCount(): number { return this.users.filter(u => u.hasChangedPassword === false).length; }
  get activePercent(): number { return this.users.length ? Math.round((this.activeCount / this.users.length) * 100) : 0; }

  goToPage(p: number): void { this.currentPage = p; this.loadUsers(); }
  prevPage(): void { if (this.currentPage > 1) { this.currentPage--; this.loadUsers(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.loadUsers(); } }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedUser = { username: '', email: '', role: 'SALES EXECUTIVE', status: 'Active', createdAt: '' };
    this.modalPassword = '';
    this.formErrors = {};
    this.errorMsg = '';
    this.showFormModal = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.selectedUser = { ...user };
    this.modalPassword = '';
    this.formErrors = {};
    this.errorMsg = '';
    this.showFormModal = true;
  }

  validateField(field: string): void {
    if (!this.selectedUser) return;
    const errors: Record<string, string> = { ...this.formErrors };
    if (field === 'username') {
      errors['username'] = !this.selectedUser.username.trim() ? 'Username is required.' : '';
    }
    if (field === 'email') {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      errors['email'] = !this.selectedUser.email.trim() ? 'Email is required.'
        : !re.test(this.selectedUser.email) ? 'Invalid email format.' : '';
    }
    if (field === 'role') {
      errors['role'] = !this.selectedUser.role ? 'Role assignment is required.' : '';
    }
    if (field === 'password' && !this.isEditMode) {
      errors['password'] = !this.modalPassword ? 'Temporary password is required.'
        : this.modalPassword.length < 8 ? 'Password must be at least 8 characters.' : '';
    }
    Object.keys(errors).forEach(k => { if (!errors[k]) delete errors[k]; });
    this.formErrors = errors;
  }

  saveUser(): void {
    if (!this.selectedUser) return;
    ['username', 'email', 'role', 'password'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length) return;
    this.saving = true;

    let action$: Observable<User>;

    if (this.isEditMode) {
      const editPayload: UpdateUserRequest = {
        username: this.selectedUser.username,
        email: this.selectedUser.email,
        role: this.selectedUser.role,
      };
      action$ = this.userService.update(this.selectedUser.id!, editPayload);
    } else {
      const createPayload: CreateUserRequest = {
        username: this.selectedUser.username,
        email: this.selectedUser.email,
        password: this.modalPassword,
        role: this.selectedUser.role,
      };
      action$ = this.userService.create(createPayload);
    }

    action$.subscribe({
      next: (saved) => {
        if (this.isEditMode) {
          const idx = this.users.findIndex(u => u.id === saved.id);
          if (idx > -1) this.users[idx] = saved;
        } else {
          this.users.push(saved);
        }
        this.saving = false;
        this.showFormModal = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not save user.';
        this.saving = false;
      },
    });
  }

  confirmDelete(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  deleteUser(): void {
    if (!this.selectedUser) return;
    this.userService.archive(this.selectedUser.id!).subscribe({
      next: (archived) => {
        // Remove the archived user from the local list
        this.users = this.users.filter(u => u.id !== archived.id);
        this.totalElements = Math.max(0, this.totalElements - 1);
        this.showDeleteModal = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not archive user.';
        this.showDeleteModal = false;
      },
    });
  }

  toggleStatus(user: User): void {
    if (user.role === 'ADMIN') return;
    this.userService.toggleStatus(user.id, user.status).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx > -1) this.users[idx] = updated;
      },
    });
  }

  roleClass(role: string): string {
    const map: Record<string, string> = {
      'ADMIN': 'role-admin',
      'WAREHOUSE MANAGER': 'role-wm',
      'SALES EXECUTIVE': 'role-sales',
      'DISTRIBUTION MANAGER': 'role-dist',
      'MANAGER': 'role-mgmt',
    };
    return map[role] || '';
  }
}
