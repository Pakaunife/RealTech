import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode'; //codificata/decodificata
import { BehaviorSubject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AuthService {
  
  private userSubject = new BehaviorSubject<any>(this.getUser());
  user$ = this.userSubject.asObservable();

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  login(token: string) {
  localStorage.setItem('token', token);
  this.userSubject.next(this.getUser());
  
}
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  //Se il token è corrotto, lo rimuove automaticamente
  getUser(): any {
    const token = this.getToken();
    if (token) {
      try {
        return jwtDecode(token);
      } catch (error) {
        // Token non valido
        localStorage.removeItem('token');
        return null;
      }
    }
    return null;
  }
   

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.removeItem('token');
    this.userSubject.next(null);
  }
  

  // Metodo per ottenere l'ID dell'utente corrente
  getUserId(): number | null {
    const user = this.getUser();
    return user ? user.id : null;
  }
}