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

    return this.http.post<RisultatoAcquisto>(`${this.baseUrl}/checkout`, {
      id_utente: idUtente,
      metodo_pagamento: datiPagamento.metodo_pagamento,
      nome_intestatario: datiPagamento.nome_intestatario,
      numero_carta_mascherato: numero_carta_mascherato
    });
  }

  // Ottieni storico acquisti dell'utente
  getStoricoAcquisti(): Observable<any[]> {
    const idUtente = this.getIdUtente();
    if (!idUtente) {
      throw new Error('Utente non autenticato');
    }

    return this.http.get<any[]>(`${this.baseUrl}/storico/${idUtente}`);
  }

  // Ottieni dettagli di un singolo acquisto
  getDettaglioAcquisto(idAcquisto: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dettaglio/${idAcquisto}`);
  }
}