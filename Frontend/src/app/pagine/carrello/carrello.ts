import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

  constructor(private carrelloService: CarrelloService, private router: Router) {
    this.carrello$ = this.carrelloService.ottieniCarrello();
  }

  ngOnInit(): void {
    this.carrello$.subscribe(carrello => {
     this.totale = Math.round(
  carrello.reduce((total, item) => total + (item.prezzo * item.quantita), 0) * 100
) / 100;
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

  // Nuovo: rimuove item (prodotto o pacchetto) in base al tipo
  rimuoviItem(item: any): void {
    if (!confirm('Vuoi rimuovere questo elemento dal carrello?')) return;

    if (item.tipo === 'pacchetto') {
      this.carrelloService.rimuoviPacchetto(item.id_pacchetto).subscribe({
        next: () => console.log('Pacchetto rimosso'),
        error: (err) => console.error('Errore rimozione pacchetto:', err)
      });
    } else {
      this.carrelloService.rimuoviDalCarrello(item.id_prodotto).subscribe({
        next: () => console.log('Prodotto rimosso'),
        error: (err) => console.error('Errore rimozione prodotto:', err)
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

  // Nuovo: aggiorna quantità per prodotto o pacchetto
  aggiornaQuantitaItem(item: any, event: any): void {
    const nuovaQuantita = parseInt(event.target.value);
    if (nuovaQuantita <= 0) return;

    if (item.tipo === 'pacchetto') {
      this.carrelloService.aggiornaPacchetto(item.id_pacchetto, nuovaQuantita).subscribe({
        next: () => console.log('Quantità pacchetto aggiornata'),
        error: (err) => console.error('Errore aggiornamento pacchetto:', err)
      });
    } else {
      this.carrelloService.aggiornaQuantita(item.id_prodotto, nuovaQuantita).subscribe({
        next: () => console.log('Quantità prodotto aggiornata'),
        error: (err) => console.error('Errore aggiornamento prodotto:', err)
      });
    }
  }

  procediAlCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
