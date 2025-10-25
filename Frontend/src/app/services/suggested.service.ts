import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuggestedService {
  private apiUrl = 'http://localhost:3000/api/suggested';

  constructor(private http: HttpClient) {}

  // Ottieni prodotti suggeriti (già salva visualizzazione automaticamente)
  getProdottiSuggeriti(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/suggested`);
  }

  salvaVisualizzazione(prodottoId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/visualizza`, { prodotto_id: prodottoId });
  }
}