import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener } from '@angular/core';
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
  popoverTop: string = '0px';
  popoverLeft: string = '0px';

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

  togglePopover(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      const target = event.currentTarget as HTMLElement;
      this.updatePosition(target);
    }
    this.isOpen = !this.isOpen;
  }

  updatePosition(target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    const popoverWidth = 270;
    const top = rect.bottom + 6;
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popoverWidth - 16);
    }
    this.popoverTop = `${top}px`;
    this.popoverLeft = `${left}px`;
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onWindowScrollResize(): void {
    if (this.isOpen) {
      this.closePopover();
    }
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

