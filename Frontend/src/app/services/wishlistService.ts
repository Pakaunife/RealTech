import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WishListService {
  private apiUrl = 'http://localhost:3000/api/wishlist';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getIdUtente(): number | null {
    const user = this.authService.getUser();
    return user ? user.id : null;
  }

  rimuovi(prodottoId: number): Observable<any> {
    const userId = this.getIdUtente();
    if (!userId) throw new Error('Utente non autenticato');
    return this.http.delete(`${this.apiUrl}/${userId}/${prodottoId}`);
  }

  getWishlist(userId: number): Observable<any[]> {
  return this.http.get<any[]>(`http://localhost:3000/api/wishlist/${userId}`);
}
  
}