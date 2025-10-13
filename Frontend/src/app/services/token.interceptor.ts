import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const TokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
   const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/catalogo',           
    '/api/products',           
    '/api/images'              
  ];
    const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  if (!token && !isPublicRoute) {
    console.log('Token mancante, redirect...');
    localStorage.clear();
    sessionStorage.clear();
    router.navigate(['/login']);
    return throwError(() => new Error('No token'));
  }
  
  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.log('401 intercettato, logout...');
        localStorage.clear();
        sessionStorage.clear();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};