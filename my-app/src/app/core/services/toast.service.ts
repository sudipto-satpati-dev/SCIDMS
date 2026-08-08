import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  public show(toast: Omit<Toast, 'id'>): string {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 4000;
    const newToast: Toast = { ...toast, id, duration };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  public success(message: string, title: string = 'Success', duration: number = 4000): string {
    return this.show({ type: 'success', title, message, duration });
  }

  public error(message: string, title: string = 'Error', duration: number = 5000): string {
    return this.show({ type: 'error', title, message, duration });
  }

  public warning(message: string, title: string = 'Warning', duration: number = 4500): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  public info(message: string, title: string = 'Information', duration: number = 4000): string {
    return this.show({ type: 'info', title, message, duration });
  }

  public remove(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter((t) => t.id !== id));
  }

  public clear(): void {
    this.toastsSubject.next([]);
  }
}
