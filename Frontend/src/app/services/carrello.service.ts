import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CarrelloService {
  private baseUrl = 'http://localhost:3000/api/carrello';
  private idUtente = 1; // Per ora fisso, dopo collegheremo autenticazione
  
  private carrelloSubject = new BehaviorSubject<any[]>([]);
  public carrello$ = this.carrelloSubject.asObservable();

  constructor(private http: HttpClient) {
    this.caricaCarrello();
  }

  aggiungiAlCarrello(idProdotto: number, quantita: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/aggiungi`, {
      id_utente: this.idUtente,
      id_prodotto: idProdotto,
      quantita: quantita
    }).pipe(
      tap(() => this.caricaCarrello())
    );
  }

  rimuoviDalCarrello(idProdotto: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/rimuovi/${this.idUtente}/${idProdotto}`).pipe(
      tap(() => this.caricaCarrello())
    );
  }

  aggiornaQuantita(idProdotto: number, quantita: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/aggiorna`, {
      id_utente: this.idUtente,
      id_prodotto: idProdotto,
      quantita: quantita
    }).pipe(
      tap(() => this.caricaCarrello())
    );
  }

  private caricaCarrello(): void {
    this.http.get<any[]>(`${this.baseUrl}/${this.idUtente}`).subscribe(
      carrello => this.carrelloSubject.next(carrello),
      err => console.error('Errore caricamento carrello:', err)
    );
  }

  ottieniCarrello(): Observable<any[]> {
    return this.carrello$;
  }

  calcolaTotale(): Observable<number> {
    return this.carrello$.pipe(
      map(carrello => carrello.reduce((total, item) => total + (item.prezzo * item.quantita), 0))
    );
  }
}