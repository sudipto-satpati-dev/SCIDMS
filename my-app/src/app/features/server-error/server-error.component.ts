import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServerStatusService } from '../../core/services/server-status.service';

@Component({
  selector: 'app-server-error',
  templateUrl: './server-error.component.html',
  styleUrls: ['./server-error.component.scss'],
})
export class ServerErrorComponent implements OnInit {
  public isChecking = false;

  constructor(
    private serverStatusService: ServerStatusService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  public retryConnection(): void {
    this.isChecking = true;

    this.serverStatusService.checkHealth().subscribe({
      next: (res) => {
        this.isChecking = false;
        if (res.online) {
          const targetUrl = this.serverStatusService.previousUrl || '/dashboard';
          this.router.navigateByUrl(targetUrl);
        } else {
          // If still offline, navigate back to previous URL anyway or stay to retry
          const targetUrl = this.serverStatusService.previousUrl || '/dashboard';
          this.router.navigateByUrl(targetUrl);
        }
      },
      error: () => {
        this.isChecking = false;
        const targetUrl = this.serverStatusService.previousUrl || '/dashboard';
        this.router.navigateByUrl(targetUrl);
      },
    });
  }
}
