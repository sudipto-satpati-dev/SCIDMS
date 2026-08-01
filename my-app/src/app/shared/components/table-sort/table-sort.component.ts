import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-table-sort',
  templateUrl: './table-sort.component.html',
  styleUrls: ['./table-sort.component.scss']
})
export class TableSortComponent {

  @Input() field: string = '';
  @Input() currentSort: string = '';

  @Output() sortChange = new EventEmitter<string>();

  get isActive(): boolean {
    if (!this.field || !this.currentSort) return false;
    return this.currentSort.toLowerCase().startsWith(`${this.field.toLowerCase()},`);
  }

  get direction(): 'asc' | 'desc' | null {
    if (!this.isActive) return null;
    const lower = this.currentSort.toLowerCase();
    if (lower.endsWith(',asc')) return 'asc';
    if (lower.endsWith(',desc')) return 'desc';
    return null;
  }

  toggleSort(): void {
    if (!this.field) return;

    let nextDir: 'asc' | 'desc' = 'asc';
    if (this.direction === 'desc') {
      nextDir = 'asc';
    } else if (this.direction === 'asc') {
      nextDir = 'desc';
    } else {
      nextDir = 'asc'; // Default to asc on first click
    }

    const newSort = `${this.field},${nextDir}`;
    this.sortChange.emit(newSort);
  }
}
