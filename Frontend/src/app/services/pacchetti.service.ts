import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pacchetto {
  id_pacchetto: number;
  nome: string;
  descrizione: string;
  prezzo_totale: number;
  immagine: string;
  immagine_url: string;
  numero_prodotti: number;
}

export interface PacchettoDettaglio {
  pacchetto: Pacchetto;
  prodotti: any[];
}

@Injectable({ 
  providedIn: 'root' 
})
export class PacchettiService {
  private apiUrl = 'http://localhost:3000/api/pacchetti';

  constructor(private http: HttpClient) {}

  // Ottieni tutti i pacchetti tematici
  getPacchetti(): Observable<Pacchetto[]> {
    return this.http.get<Pacchetto[]>(this.apiUrl);
  }

  // Ottieni dettagli di un pacchetto specifico con prodotti
  getPacchettoDettaglio(id: number): Observable<PacchettoDettaglio> {
    return this.http.get<PacchettoDettaglio>(`${this.apiUrl}/${id}`);
  }
}