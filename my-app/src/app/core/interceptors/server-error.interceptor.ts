import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ServerStatusService } from '../services/server-status.service';

@Injectable()
export class ServerErrorInterceptor implements HttpInterceptor {
  constructor(
    private serverStatusService: ServerStatusService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Status 0 = Cannot connect / CORS refusal / Server down / Offline
        // Status 500, 502, 503, 504 = Server-side internal/gateway errors
        const isConnectionOrServerError =
          error.status === 0 ||
          (error.status >= 500 && error.status <= 599);

        if (isConnectionOrServerError) {
          this.serverStatusService.setServerDown({
            status: error.status || 0,
            statusText: error.statusText || (error.status === 0 ? 'Network Connection Refused' : 'Internal Server Error'),
            url: req.url,
            message: error.message || 'Server connection failed unexpectedly.',
            timestamp: new Date().toLocaleTimeString(),
          });

          // Redirect user to the "It's not you, it's us" page if not already there
          if (!this.router.url.includes('/server-error')) {
            this.serverStatusService.previousUrl = this.router.url;
            this.router.navigate(['/server-error']);
          }
        }

        return throwError(() => error);
      })
    );
  }
}
