import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private apiUrl = 'http://localhost:3000/api/catalogo';

  constructor(private http: HttpClient) {}

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
}