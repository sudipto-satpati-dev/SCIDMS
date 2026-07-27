import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/index';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  users: User[] = [];
  loading = true;

  filterRole   = '';
  filterStatus = '';
  showFormModal   = false;
  showDeleteModal = false;
  selectedUser: User | null = null;
  isEditMode     = false;
  currentPage    = 1;
  pageSize       = 10;
  showModalPassword = false;
  modalPassword     = '';
  formErrors: Record<string, string> = {};
  saving   = false;
  errorMsg = '';

  roles: UserRole[] = ['Administrator', 'Warehouse Manager', 'Sales Executive', 'Distribution Manager', 'Management'];

  private avatarColors: Record<string, string> = {};
  private palette = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#f5f3ff', '#ffedd5'];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getAll().subscribe(data => {
      this.users   = data;
      this.loading = false;
    });
  }

  avatarBg(username: string): string {
    if (!this.avatarColors[username]) {
      this.avatarColors[username] = this.palette[username.charCodeAt(0) % this.palette.length];
    }
    return this.avatarColors[username];
  }

  get filtered(): User[] {
    return this.users.filter(u => {
      const matchRole   = !this.filterRole   || u.role === this.filterRole;
      const matchStatus = !this.filterStatus || u.status === this.filterStatus;
      return matchRole && matchStatus;
    });
  }

  get totalPages(): number  { return Math.ceil(this.filtered.length / this.pageSize) || 1; }
  get pageStart():  number  { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd():    number  { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  get paged():      User[]  { return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  get activeCount():   number { return this.users.filter(u => u.status === 'Active').length; }
  get inactiveCount(): number { return this.users.filter(u => u.status === 'Inactive').length; }
  get activePercent(): number { return this.users.length ? Math.round((this.activeCount / this.users.length) * 100) : 0; }

  goToPage(p: number): void  { this.currentPage = p; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }

  openAddModal(): void {
    this.isEditMode   = false;
    this.selectedUser = { id: '', username: '', email: '', role: 'Sales Executive', status: 'Active', createdAt: '' };
    this.modalPassword = '';
    this.formErrors    = {};
    this.errorMsg      = '';
    this.showFormModal = true;
  }

  openEditModal(user: User): void {
    this.isEditMode   = true;
    this.selectedUser = { ...user };
    this.modalPassword = '';
    this.formErrors    = {};
    this.errorMsg      = '';
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

    const payload: Omit<User, 'id' | 'createdAt'> = {
      username: this.selectedUser.username,
      email:    this.selectedUser.email,
      role:     this.selectedUser.role,
      status:   this.selectedUser.status,
    };

    const action$ = this.isEditMode
      ? this.userService.update(this.selectedUser.id, payload)
      : this.userService.create(payload);

    action$.subscribe({
      next: (saved) => {
        if (this.isEditMode) {
          const idx = this.users.findIndex(u => u.id === saved.id);
          if (idx > -1) this.users[idx] = saved;
        } else {
          this.users.push(saved);
        }
        this.saving        = false;
        this.showFormModal = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not save user.';
        this.saving   = false;
      },
    });
  }

  confirmDelete(user: User): void {
    this.selectedUser    = user;
    this.showDeleteModal = true;
  }

  deleteUser(): void {
    if (!this.selectedUser) return;
    // Soft-delete via status toggle (BRD BR021: soft deletion)
    this.userService.toggleStatus(this.selectedUser.id).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx > -1) this.users[idx] = updated;
        this.showDeleteModal = false;
      },
    });
  }

  toggleStatus(user: User): void {
    this.userService.toggleStatus(user.id).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx > -1) this.users[idx] = updated;
      },
    });
  }

  roleClass(role: string): string {
    const map: Record<string, string> = {
      'Administrator':        'role-admin',
      'Warehouse Manager':    'role-wm',
      'Sales Executive':      'role-sales',
      'Distribution Manager': 'role-dist',
      'Management':           'role-mgmt',
    };
    return map[role] || '';
  }
}
