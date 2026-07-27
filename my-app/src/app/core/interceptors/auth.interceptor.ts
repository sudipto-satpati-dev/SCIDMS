/**
 * AuthInterceptor — attaches the Bearer token to outgoing HTTP requests.
 *
 * Currently the mock API doesn't use HTTP, so this interceptor is a no-op
 * for mock calls. It IS wired and ready so that when you switch to real
 * HttpClient calls, every request will automatically carry the JWT.
 *
 * MIGRATION: No changes needed here. Just start using HttpClient in services.
 */
import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.token;

    // Attach Authorization header if token exists
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // BRD Exception: expired JWT → redirect to login
        if (err.status === 401) {
          this.auth.logout();
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => err);
      }),
    );
  }
}
