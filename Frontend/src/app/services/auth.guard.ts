import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('token');
    // Se la rotta richiede admin 
   if (route.data['admin']) {
      if (this.auth.isLoggedIn() && this.auth.isAdmin()) {
        return true;
      }
      this.router.navigate(['/login']);
      return false;
    }

    // Altrimenti, solo autenticazione
    if (this.auth.isLoggedIn()) {
      return true;
    }

    // Se non autenticato, redirect a login
    this.router.navigate(['/login']);
    return false;
  }

}