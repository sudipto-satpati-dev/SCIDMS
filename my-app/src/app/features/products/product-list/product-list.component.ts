import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product, Category, CreateProductRequest } from '../../../core/models/index';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];
  categories: Category[] = [];
  loading = true;
  saving = false;
  errorMsg = '';

  // Filter params
  searchTerm = '';
  filterCategory: number | '' = '';
  filterStatus: '' | 'ACTIVE' | 'INACTIVE' = '';
  sortParam = 'createdAt,desc';

  // Pagination params
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;

  // Modal controls
  showFormModal = false;
  showCategoryModal = false;
  newProduct: { name: string; categoryId: number | null; unitPrice: number | null } = {
    name: '',
    categoryId: null,
    unitPrice: null
  };
  formErrors: Record<string, string> = {};

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAll({
      search: this.searchTerm || undefined,
      categoryId: this.filterCategory !== '' ? Number(this.filterCategory) : undefined,
      status: this.filterStatus || undefined,
      page: this.currentPage - 1,
      size: this.pageSize,
      sort: this.sortParam,
    }).subscribe({
      next: (result) => {
        this.products = result.products;
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not load products.';
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data || [];
      },
      error: (err) => {
        console.warn('Could not fetch categories:', err?.message);
      }
    });
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadProducts();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onSortChange(sort: string): void {
    this.sortParam = sort;
    this.currentPage = 1;
    this.loadProducts();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterCategory = '';
    this.filterStatus = '';
    this.currentPage = 1;
    this.loadProducts();
  }

  get pageStart(): number {
    return this.totalElements === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalElements);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number): void {
    this.currentPage = p;
    this.loadProducts();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  openAddModal(): void {
    this.newProduct = { name: '', categoryId: null, unitPrice: null };
    this.formErrors = {};
    this.errorMsg = '';
    this.showFormModal = true;
  }

  openCategoryModal(): void {
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
  }

  onCategoryAdded(newCat: Category): void {
    if (newCat) {
      this.loadCategories();
    }
  }

  validateField(field: string): void {
    const errors = { ...this.formErrors };
    if (field === 'name') {
      errors['name'] = !this.newProduct.name?.trim() ? 'Product name is required.' : '';
    }
    if (field === 'categoryId') {
      errors['categoryId'] = !this.newProduct.categoryId ? 'Category selection is required.' : '';
    }
    if (field === 'unitPrice') {
      errors['unitPrice'] = (this.newProduct.unitPrice == null || this.newProduct.unitPrice <= 0)
        ? 'Price must be greater than 0.' : '';
    }
    Object.keys(errors).forEach(k => { if (!errors[k]) delete errors[k]; });
    this.formErrors = errors;
  }

  saveProduct(): void {
    ['name', 'categoryId', 'unitPrice'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length || !this.newProduct.name || !this.newProduct.categoryId || !this.newProduct.unitPrice) {
      return;
    }
    this.saving = true;
    this.errorMsg = '';

    const payload: CreateProductRequest = {
      name: this.newProduct.name.trim(),
      categoryId: Number(this.newProduct.categoryId),
      unitPrice: Number(this.newProduct.unitPrice),
    };

    this.productService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showFormModal = false;
        this.loadProducts();
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not create product.';
        this.saving = false;
      }
    });
  }

  formatPrice(n: number): string {
    return '৳ ' + (n ? n.toLocaleString('en-BD') : '0');
  }
}
