import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface ServerErrorInfo {
  status?: number;
  statusText?: string;
  url?: string;
  message?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class ServerStatusService {
  private isServerDownSubject = new BehaviorSubject<boolean>(false);
  public isServerDown$: Observable<boolean> = this.isServerDownSubject.asObservable();

  private lastErrorDetailsSubject = new BehaviorSubject<ServerErrorInfo | null>(null);
  public lastErrorDetails$: Observable<ServerErrorInfo | null> = this.lastErrorDetailsSubject.asObservable();

  private isOfflineSimulated = false;

  constructor() {
    // Listen for browser offline/online status changes
    window.addEventListener('offline', () => {
      this.setServerDown({
        status: 0,
        statusText: 'Offline',
        message: 'Your browser is currently offline. Internet connection lost.',
        timestamp: new Date().toLocaleTimeString(),
      });
    });

    window.addEventListener('online', () => {
      // Auto attempt recovery if not manually simulated
      if (!this.isOfflineSimulated) {
        this.setServerOnline();
      }
    });
  }

  public get isServerDown(): boolean {
    return this.isServerDownSubject.value;
  }

  public get isSimulated(): boolean {
    return this.isOfflineSimulated;
  }

  public setServerDown(info?: Partial<ServerErrorInfo>): void {
    const errorDetails: ServerErrorInfo = {
      status: info?.status ?? 0,
      statusText: info?.statusText ?? 'Server Unreachable',
      url: info?.url ?? '/api',
      message: info?.message ?? 'Could not establish connection with the SCIDMS backend server.',
      timestamp: info?.timestamp ?? new Date().toLocaleTimeString(),
    };

    this.lastErrorDetailsSubject.next(errorDetails);
    this.isServerDownSubject.next(true);
  }

  public setServerOnline(): void {
    this.isOfflineSimulated = false;
    this.isServerDownSubject.next(false);
    this.lastErrorDetailsSubject.next(null);
  }

  public simulateServerError(): void {
    this.isOfflineSimulated = true;
    this.setServerDown({
      status: 503,
      statusText: 'Service Unavailable (Simulated)',
      url: '/api/v1/health',
      message: 'Simulated backend service disruption for testing.',
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  public checkHealth(): Observable<{ online: boolean; message: string }> {
    // Simulates an async server ping health-check
    const isOnline = !this.isOfflineSimulated && navigator.onLine;

    if (isOnline) {
      this.setServerOnline();
    }

    return of({
      online: isOnline,
      message: isOnline
        ? 'Connection restored! Server is operational.'
        : 'Server is still unreachable. Please try again in a few moments.',
    }).pipe(delay(1200));
  }
}
