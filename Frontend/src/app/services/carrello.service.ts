import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CarrelloService {
  private baseUrl = 'http://localhost:3000/api/carrello';
  
  private carrelloSubject = new BehaviorSubject<any[]>([]);
  public carrello$ = this.carrelloSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.caricaCarrello();
  }

  //qui prende id utente dal token, Il token è firmato dal backend con una chiave segreta
  private getIdUtente(): number | null {
    const user = this.authService.getUser();  //chiama getUser di authService
    return user ? user.id : null;
  }

  // qua permette solo utenti autenticati possono gestire il carrello
  aggiungiAlCarrello(idProdotto: number, quantita: number): Observable<any> {
    const idUtente = this.getIdUtente(); //prende id utente da sopra 
    if (!idUtente) {
      throw new Error('Utente non autenticato. Effettua il login per aggiungere prodotti al carrello.');
    }
    
    return this.http.post(`${this.baseUrl}/aggiungi`, {
      id_utente: idUtente,
      id_prodotto: idProdotto,
      quantita: quantita
    }).pipe(
      tap(() => this.caricaCarrello())
    );
  }

  // Aggiungi pacchetto al carrello (chiamata al backend)
  aggiungiPacchettoAlCarrello(idPacchetto: number, quantita: number): Observable<any> {
    const idUtente = this.getIdUtente();
    if (!idUtente) {
      throw new Error('Utente non autenticato. Effettua il login per aggiungere pacchetti al carrello.');
    }

    return this.http.post(`${this.baseUrl}/aggiungiPacchetto`, {
      id_utente: idUtente,
      id_pacchetto: idPacchetto,
      quantita: quantita
    }).pipe(
      tap(() => this.caricaCarrello())
    );
  }

  rimuoviDalCarrello(idProdotto: number): Observable<any> {
    const idUtente = this.getIdUtente();
    if (!idUtente) {
      throw new Error('Utente non autenticato. Effettua il login per gestire il carrello.');
    }
    
    return this.http.delete(`${this.baseUrl}/rimuovi/${idUtente}/${idProdotto}`).pipe(
      tap(() => this.caricaCarrello())
    );
  }

  // Rimuovi un pacchetto dal carrello
  rimuoviPacchetto(idPacchetto: number): Observable<any> {
    const idUtente = this.getIdUtente();
    if (!idUtente) {
      throw new Error('Utente non autenticato. Effettua il login per gestire il carrello.');
    }

    return this.http.delete(`${this.baseUrl}/rimuoviPacchetto/${idUtente}/${idPacchetto}`).pipe(
      tap(() => this.caricaCarrello())
    );
  }

  // Aggiorna quantità di un pacchetto
  aggiornaPacchetto(idPacchetto: number, quantita: number): Observable<any> {
    const idUtente = this.getIdUtente();
    if (!idUtente) {
      throw new Error('Utente non autenticato. Effettua il login per gestire il carrello.');
    }

    return this.http.put(`${this.baseUrl}/aggiornaPacchetto`, {
      id_utente: idUtente,
      id_pacchetto: idPacchetto,
      quantita: quantita
    }).pipe(
      tap(() => this.caricaCarrello())
    );
  }

  aggiornaQuantita(idProdotto: number, quantita: number): Observable<any> {
    const idUtente = this.getIdUtente();
    if (!idUtente) {
      throw new Error('Utente non autenticato. Effettua il login per gestire il carrello.');
    }
    
    return this.http.put(`${this.baseUrl}/aggiorna`, {
      id_utente: idUtente,
      id_prodotto: idProdotto,
      quantita: quantita
    }).pipe(
      tap(() => this.caricaCarrello())
    );
  }

  //se non sei loggato → carrello vuoto, se sei loggato → carrello personale
  private caricaCarrello(): void {
    const idUtente = this.getIdUtente();
    if (!idUtente) {
      // Se l'utente non è loggato, svuota il carrello
      this.carrelloSubject.next([]);
      return;
    }
    
    this.http.get<any[]>(`${this.baseUrl}/${idUtente}`).subscribe(
      carrello => this.carrelloSubject.next(carrello),
      err => console.error('Errore caricamento carrello:', err)
    );
  }

  ottieniCarrello(): Observable<any[]> {
    return this.carrello$;
  }

  calcolaTotale(): Observable<number> {
    return this.carrello$.pipe(
      // per prezzo in caso promo fosse true
      map(carrello => carrello.reduce((total, item) => {
        const unit = item.prezzo_scontato != null ? item.prezzo_scontato : item.prezzo;
        return total + (unit * item.quantita);
      }, 0))
    );
  }

  // Metodo per ricaricare il carrello dopo il login
  ricaricaCarrello(): void {
    this.caricaCarrello();
  }

  // Metodo per svuotare il carrello al logout
  svuotaCarrello(): void {
    this.carrelloSubject.next([]);
  }

  // Metodo per aggiornare il carrello dopo un acquisto (ricarica dal backend)
  aggiornaDopoAcquisto(): void {
    this.caricaCarrello();
  }

}