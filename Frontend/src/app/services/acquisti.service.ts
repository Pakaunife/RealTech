//si occupa di gestire la comunicazione con il backend e la logica degli acquisti. mentre checkout.ts si occupa solo dell’interfaccia utente.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface DatiCheckout {
  metodo_pagamento: string;
  nome_intestatario: string;
  numero_carta: string;
}

export interface RisultatoAcquisto {
  success: boolean;
  message: string;
  acquisti: any[];
  totale: number;
}

@Injectable({
  providedIn: 'root'
})
export class AcquistiService {
  private baseUrl = 'http://localhost:3000/api/acquisti';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getIdUtente(): number | null {
    const user = this.authService.getUser();
    return user ? user.id : null;
  }

  // Processa il checkout
  processaCheckout(datiPagamento: DatiCheckout): Observable<RisultatoAcquisto> {
    const idUtente = this.getIdUtente();
    if (!idUtente) {
      throw new Error('Utente non autenticato');
    }

    // Maschera il numero di carta (mostra solo le ultime 4 cifre)
    const numero_carta_mascherato = '**** **** **** ' + datiPagamento.numero_carta.slice(-4);

    return this.http.post<RisultatoAcquisto>(`${this.baseUrl}/checkout`, { //manda richiesta POST al backend per processare il checkout
      //dati da mandare al backend
      id_utente: idUtente,
      metodo_pagamento: datiPagamento.metodo_pagamento,
      nome_intestatario: datiPagamento.nome_intestatario,
      numero_carta_mascherato: numero_carta_mascherato
    });
    //Il backend riceve questi dati, li elabora (registra l’acquisto, svuota il carrello, ecc.) e restituisce una risposta.
  }

  // Ottieni storico acquisti dell'utente
  getStoricoAcquisti(): Observable<any[]> {
    const idUtente = this.getIdUtente();
    if (!idUtente) {
      throw new Error('Utente non autenticato');
    }

    return this.http.get<any[]>(`${this.baseUrl}/storico/${idUtente}`); //manda richiesta GET al backend per ottenere lo storico acquisti dell'utente (vedi aquisti.js nel backend router.get('/storico/:id_utente', async (req, res) => )
  }

  // Ottieni dettagli di un singolo acquisto
  getDettaglioAcquisto(idAcquisto: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dettaglio/${idAcquisto}`);
  }
}