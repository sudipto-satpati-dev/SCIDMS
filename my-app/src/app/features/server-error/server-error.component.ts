import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ServerStatusService, ServerErrorInfo } from '../../core/services/server-status.service';

@Component({
  selector: 'app-server-error',
  templateUrl: './server-error.component.html',
  styleUrls: ['./server-error.component.scss'],
})
export class ServerErrorComponent implements OnInit, OnDestroy {
  public errorInfo: ServerErrorInfo | null = null;
  public isChecking = false;
  public checkResult: { success?: boolean; message?: string } | null = null;
  public isSimulated = false;

  private sub = new Subscription();

  constructor(
    private serverStatusService: ServerStatusService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.serverStatusService.lastErrorDetails$.subscribe((info) => {
        this.errorInfo = info;
        this.isSimulated = this.serverStatusService.isSimulated;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  public retryConnection(): void {
    this.isChecking = true;
    this.checkResult = null;

    this.serverStatusService.checkHealth().subscribe({
      next: (res) => {
        this.isChecking = false;
        if (res.online) {
          this.checkResult = {
            success: true,
            message: 'Server connection re-established! Redirecting to dashboard...',
          };
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        } else {
          this.checkResult = {
            success: false,
            message: res.message,
          };
        }
      },
      error: () => {
        this.isChecking = false;
        this.checkResult = {
          success: false,
          message: 'Connection attempt failed. Server is still unreachable.',
        };
      },
    });
  }

  public toggleSimulation(): void {
    if (this.isSimulated) {
      this.serverStatusService.setServerOnline();
      this.checkResult = {
        success: true,
        message: 'Simulation cleared! Backend server marked operational.',
      };
    } else {
      this.serverStatusService.simulateServerError();
      this.checkResult = {
        success: false,
        message: 'Simulated server error activated.',
      };
    }
  }

  public goHome(): void {
    if (!this.serverStatusService.isServerDown) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
