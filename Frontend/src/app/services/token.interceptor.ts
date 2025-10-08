import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    
    console.log('Interceptor chiamato. Token:', token);
    
    let clonedReq = req;
    if (token) {
      clonedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(clonedReq).pipe(
      tap(response => {
        console.log('Risposta ricevuta:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('=== ERRORE COMPLETO ===');
        console.log('Status:', error.status);
        console.log('Message:', error.message);
        console.log('Error object:', error);
        console.log('======================');
        
        if (error.status === 401) {
          console.log('401 intercettato, logout...');
          localStorage.clear();
          sessionStorage.clear();
          this.router.navigate(['/login']);
        }
        
        return throwError(() => error);
      })
    );
  }
}