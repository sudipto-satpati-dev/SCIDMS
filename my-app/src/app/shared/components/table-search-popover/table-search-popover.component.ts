import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-table-search-popover',
  templateUrl: './table-search-popover.component.html',
  styleUrls: ['./table-search-popover.component.scss']
})
export class TableSearchPopoverComponent implements OnInit, OnDestroy {

  @Input() title: string = 'Search';
  @Input() placeholder: string = 'Type keyword...';
  @Input() debounceMs: number = 300;
  @Input() totalResults: number | null = null;
  @Input() value: string = '';

  @Output() valueChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();

  isOpen: boolean = false;
  searchInput: string = '';
  appliedSearchTerm: string = '';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchInput = this.value || '';
    this.appliedSearchTerm = this.value || '';

    this.searchSubject
      .pipe(
        debounceTime(this.debounceMs),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        const trimmed = term.trim();
        this.appliedSearchTerm = trimmed;
        this.valueChange.emit(trimmed);
        this.searchChange.emit(trimmed);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(val: string): void {
    this.searchInput = val;
    this.searchSubject.next(val);
  }

  togglePopover(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen = !this.isOpen;
  }

  closePopover(): void {
    this.isOpen = false;
  }

  clearSearch(): void {
    this.searchInput = '';
    this.appliedSearchTerm = '';
    this.searchSubject.next('');
  }
}
