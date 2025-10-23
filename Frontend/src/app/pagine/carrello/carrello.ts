import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-carrello',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './carrello.html',
  styleUrls: ['./carrello.css']
})
export class Carrello implements OnInit {
  carrello$: Observable<any[]>;  //carrello$ ha i dati del carrello
  totale: number = 0;
  carrelloGuest: any[] = [];

  // trackBy function per mantenere gli elementi stabili nel DOM
  trackByItem(index: number, item: any) {
    // usa id_prodotto o id_pacchetto a seconda del tipo
    return item.tipo === 'pacchetto' ? `pacchetto-${item.id_pacchetto}` : `prodotto-${item.id_prodotto}`;
  }

  constructor(private carrelloService: CarrelloService, private router: Router, public auth: AuthService) {
    this.carrello$ = this.carrelloService.ottieniCarrello();
  }

  ngOnInit(): void {
  if (!this.auth.isLoggedIn()) {
    // Guest: carica dal localStorage
    this.carrelloGuest = this.carrelloService.getCarrelloGuest();
    this.totale = Math.round(
      this.carrelloGuest.reduce((total, item) => total + (item.prezzo * item.quantita), 0) * 100
    ) / 100;
  } else {
    // Utente loggato: carica dal backend
    this.carrello$.subscribe(carrello => {
      this.totale = Math.round(
        carrello.reduce((total, item) => total + (item.prezzo * item.quantita), 0) * 100
      ) / 100;
    });
  }
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
  rimuoviProdottoGuest(idProdotto: number): void {
  this.carrelloGuest = this.carrelloGuest.filter(item => item.id_prodotto !== idProdotto);
  this.carrelloService.setCarrelloGuest(this.carrelloGuest);
  this.totale = Math.round(
    this.carrelloGuest.reduce((total, item) => total + (item.prezzo * item.quantita), 0) * 100
  ) / 100;
}

aggiornaQuantitaGuest(idProdotto: number, event: any): void {
  const nuovaQuantita = parseInt(event.target.value);
  if (nuovaQuantita > 0) {
    const item = this.carrelloGuest.find(i => i.id_prodotto === idProdotto);
    if (item) item.quantita = nuovaQuantita;
    this.carrelloService.setCarrelloGuest(this.carrelloGuest);
    this.totale = Math.round(
      this.carrelloGuest.reduce((total, item) => total + (item.prezzo * item.quantita), 0) * 100
    ) / 100;
  }
}


  procediAlCheckout(): void {
    if (!this.auth.isLoggedIn()) {
      alert('Devi essere loggato per procedere al checkout.');
    this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
  } else {
    this.router.navigate(['/checkout']);
  }
}
}
