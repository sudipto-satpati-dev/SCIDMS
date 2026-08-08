import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CreateCategoryRequest } from '../../../core/models/index';

@Component({
  selector: 'app-category-modal',
  templateUrl: './category-modal.component.html',
  styleUrls: ['./category-modal.component.scss']
})
export class CategoryModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() categoryAdded = new EventEmitter<Category>();

  categories: Category[] = [];
  loading = false;
  saving = false;
  errorMsg = '';
  successMsg = '';
  searchTerm = '';

  formData: CreateCategoryRequest = {
    name: '',
    description: ''
  };

  formErrors: Record<string, string> = {};

  constructor(
    private categoryService: CategoryService,
    private toastService: ToastService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      this.loadCategories();
    }
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.message || 'Failed to load categories.';
      }

    });
  }

  get filteredCategories(): Category[] {
    if (!this.searchTerm.trim()) {
      return this.categories;
    }
    const q = this.searchTerm.toLowerCase();
    return this.categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      c.status.toLowerCase().includes(q)
    );
  }

  validate(): boolean {
    this.formErrors = {};
    if (!this.formData.name || !this.formData.name.trim()) {
      this.formErrors['name'] = 'Category name is required.';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  onSubmit(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.validate()) {
      return;
    }

    this.saving = true;
    this.categoryService.create(this.formData).subscribe({
      next: (newCategory) => {
        this.saving = false;
        this.successMsg = `Category "${newCategory.name}" added successfully!`;
        this.toastService.success(`Category "${newCategory.name}" created!`, 'Category Added');
        this.formData = { name: '', description: '' };
        this.formErrors = {};
        this.categoryAdded.emit(newCategory);
        this.loadCategories();

        setTimeout(() => {
          this.successMsg = '';
        }, 4000);
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.message || 'Failed to add category. Please try again.';
        this.toastService.error(this.errorMsg, 'Category Creation Failed');
      }
    });
  }

  resetForm(): void {
    this.formData = { name: '', description: '' };
    this.formErrors = {};
    this.errorMsg = '';
    this.successMsg = '';
    this.searchTerm = '';
  }

  closeModal(): void {
    this.closed.emit();
  }
}
