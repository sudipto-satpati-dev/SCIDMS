import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product, Category } from '../../../core/models/index';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];
  loading = true;

  searchTerm     = '';
  filterCategory = '';
  filterStock    = '';
  showFormModal        = false;
  showDeactivateModal  = false;
  showCategoryModal    = false;
  selectedProduct: Product | null = null;
  isEditMode   = false;
  currentPage  = 1;
  pageSize     = 8;
  formErrors: Record<string, string> = {};
  saving = false;
  errorMsg = '';

  categories: string[] = ['Electronics', 'Industrial', 'Packaging', 'Safety', 'Tools', 'Raw Materials'];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe(data => {
      this.products = data;
      this.loading  = false;
    });

    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const catNames = data.map(c => c.name);
          const combined = Array.from(new Set([...this.categories, ...catNames]));
          this.categories = combined;
        }
      },
      error: (err) => {
        console.warn('Could not fetch categories:', err?.message);
      }
    });
  }


  openCategoryModal(): void {
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
  }

  onCategoryAdded(newCat: Category): void {
    if (newCat && newCat.name && !this.categories.includes(newCat.name)) {
      this.categories = [...this.categories, newCat.name];
    }
  }


  stockStatus(p: Product): 'out' | 'low' | 'ok' {
    if (p.availableQty === 0) return 'out';
    if (p.availableQty <= p.threshold) return 'low';
    return 'ok';
  }

  get filtered(): Product[] {
    return this.products.filter(p => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch = !s || p.id.toLowerCase().includes(s) || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s);
      const matchCat    = !this.filterCategory || p.category === this.filterCategory;
      const stock       = this.stockStatus(p);
      const matchStock  = !this.filterStock
        || (this.filterStock === 'in'  && stock === 'ok')
        || (this.filterStock === 'low' && stock === 'low')
        || (this.filterStock === 'out' && stock === 'out');
      return matchSearch && matchCat && matchStock;
    });
  }

  get totalPages(): number  { return Math.ceil(this.filtered.length / this.pageSize) || 1; }
  get pageStart():  number  { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd():    number  { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }
  get paged():      Product[] { return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  get totalActive():     number { return this.products.filter(p => p.status === 'Active').length; }
  get lowStockCount():   number { return this.products.filter(p => this.stockStatus(p) === 'low').length; }
  get outOfStockCount(): number { return this.products.filter(p => this.stockStatus(p) === 'out').length; }
  get totalLowStock():   number { return this.lowStockCount + this.outOfStockCount; }

  goToPage(p: number)  { this.currentPage = p; }
  prevPage()           { if (this.currentPage > 1) this.currentPage--; }
  nextPage()           { if (this.currentPage < this.totalPages) this.currentPage++; }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedProduct = { id: '', name: '', category: 'Industrial', unitPrice: 0, availableQty: 0, threshold: 10, status: 'Active', sku: '' };
    this.formErrors = {};
    this.errorMsg   = '';
    this.showFormModal = true;
  }

  openEditModal(p: Product): void {
    this.isEditMode      = true;
    this.selectedProduct = { ...p };
    this.formErrors      = {};
    this.errorMsg        = '';
    this.showFormModal   = true;
  }

  confirmDeactivate(p: Product): void {
    this.selectedProduct    = p;
    this.showDeactivateModal = true;
  }

  deactivateProduct(): void {
    if (!this.selectedProduct) return;
    this.productService.toggleStatus(this.selectedProduct.id).subscribe({
      next: (updated) => {
        const idx = this.products.findIndex(p => p.id === updated.id);
        if (idx > -1) this.products[idx] = updated;
        this.showDeactivateModal = false;
      },
    });
  }

  validateField(field: string): void {
    if (!this.selectedProduct) return;
    const e = { ...this.formErrors };
    if (field === 'name')      e['name']      = !this.selectedProduct.name.trim()      ? 'Product name is required.'    : '';
    if (field === 'category')  e['category']  = !this.selectedProduct.category         ? 'Category is required.'        : '';
    if (field === 'unitPrice') e['unitPrice'] = this.selectedProduct.unitPrice <= 0    ? 'Price must be greater than 0.' : '';
    if (field === 'sku')       e['sku']       = !this.selectedProduct.sku.trim()        ? 'SKU is required.'             : '';
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
    this.formErrors = e;
  }

  saveProduct(): void {
    ['name', 'category', 'unitPrice', 'sku'].forEach(f => this.validateField(f));
    if (Object.keys(this.formErrors).length || !this.selectedProduct) return;
    this.saving = true;

    const action$ = this.isEditMode
      ? this.productService.update(this.selectedProduct.id, this.selectedProduct)
      : this.productService.create(this.selectedProduct);

    action$.subscribe({
      next: (saved) => {
        if (this.isEditMode) {
          const idx = this.products.findIndex(p => p.id === saved.id);
          if (idx > -1) this.products[idx] = saved;
        } else {
          this.products.unshift(saved);
        }
        this.saving        = false;
        this.showFormModal = false;
      },
      error: (err) => {
        this.errorMsg = err?.message || 'Could not save product.';
        this.saving   = false;
      },
    });
  }

  formatPrice(n: number): string { return '৳ ' + n.toLocaleString('en-BD'); }

  categoryColor(cat: string): string {
    const map: Record<string, string> = {
      'Electronics': '#3b82f6', 'Industrial': '#f59e0b',
      'Packaging':   '#8b5cf6', 'Safety':     '#ef4444',
      'Tools':       '#06b6d4', 'Raw Materials': '#10b981',
    };
    return map[cat] || '#94a3b8';
  }
}
