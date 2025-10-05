import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode'; //codificata/decodificata

@Injectable({ providedIn: 'root' })
export class AuthService {
  getToken(): string | null {
    return localStorage.getItem('token');
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
        // Token non valido, rimuovilo
        localStorage.removeItem('token');
        return null;
      }
    }
    return null;
  }

  logout() {
    localStorage.removeItem('token');
  }

  // Metodo per ottenere l'ID dell'utente corrente
  getUserId(): number | null {
    const user = this.getUser();
    return user ? user.id : null;
  }
}