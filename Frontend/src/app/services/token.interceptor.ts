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
  '/api/catalogo/vetrina',
  '/api/products',
  '/api/images',
  '/assets',
  '/uploads',
  '/public'
];
    const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  if (!token && !isPublicRoute && req.method !== 'GET') {
  // Solo le richieste NON GET e NON pubbliche richiedono login
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
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
  if (error.status === 401 && !isPublicRoute) {
    console.log('401 intercettato, logout...');
    localStorage.clear();
    sessionStorage.clear();
    router.navigate(['/login']);
  }
  return throwError(() => error);
})
  );
};