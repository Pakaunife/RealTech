import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private apiUrl = 'http://localhost:3000/api/catalogo';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getIdUtente(): number | null {
    const user = this.authService.getUser();  //chiama getUser di authService
    return user ? user.id : null;
  }

  // Ottieni prodotti più visualizzati (per la home)
  getProdottiPopular(limit: number = 6): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/popular?limit=${limit}`);
  }

  // Ottieni tutte le categorie
  getCategorie(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/prodotti`);
  }

  // Ottieni prodotti per categoria
  getProdottiPerCategoria(nomeCategoria: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/prodotti/categoria/${nomeCategoria}`);
  }

  // Ottieni tutti i brand
  getBrand(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/brand`);
  }

  // Ottieni suggerimenti di ricerca
  getSearchSuggestions(query: string, limit: number = 5): Observable<any[]> {
    if (!query || query.trim().length < 2) {
      return new Observable(observer => observer.next([]));
    }
    return this.http.get<any[]>(`${this.apiUrl}/search/suggestions`, {
      params: { q: query.trim(), limit: limit.toString() }
    });
  }

aggiungiAWishlist(prodotto: any): void {
  const idUtente = this.getIdUtente();
  if (!idUtente) {
    alert('Devi essere autenticato per aggiungere alla wishlist!');
    return;
  }
  this.http.post('http://localhost:3000/api/wishlist', {
    user_id: idUtente,
    prodotto_id: prodotto.id_prodotto
  }).subscribe({
    next: () => {
      alert('Prodotto aggiunto alla wishlist!');
    },
    error: (err) => {
      console.error('Errore wishlist:', err);
      alert('Errore nell\'aggiungere il prodotto alla wishlist');
    }
  });
}

}