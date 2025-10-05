import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarrelloService } from '../../services/carrello.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-carrello',
  imports: [CommonModule],
  templateUrl: './carrello.html',
  styleUrl: './carrello.css'
})
export class Carrello implements OnInit {
  carrello$: Observable<any[]>;  //carrello$ ha i dati del carrello
  totale: number = 0;

  constructor(private carrelloService: CarrelloService) {
    this.carrello$ = this.carrelloService.ottieniCarrello();
  }

  ngOnInit(): void {
    this.carrello$.subscribe(carrello => {
      this.totale = carrello.reduce((total, item) => total + (item.prezzo * item.quantita), 0);
    });
  }

  rimuoviProdotto(idProdotto: number): void {
    if (confirm('Vuoi rimuovere questo prodotto dal carrello?')) {
      this.carrelloService.rimuoviDalCarrello(idProdotto).subscribe({
        next: () => console.log('Prodotto rimosso'),
        error: (err) => console.error('Errore:', err)
      });
    }
  }

  aggiornaQuantita(idProdotto: number, event: any): void {
    const nuovaQuantita = parseInt(event.target.value);
    if (nuovaQuantita > 0) {
      this.carrelloService.aggiornaQuantita(idProdotto, nuovaQuantita).subscribe({
        next: () => console.log('Quantità aggiornata'),
        error: (err) => console.error('Errore:', err)
      });
    }
  }
}
