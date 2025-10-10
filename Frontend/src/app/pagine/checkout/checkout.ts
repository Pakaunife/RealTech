import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';
import { AcquistiService, DatiCheckout } from '../../services/acquisti.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class Checkout implements OnInit {
  carrello$: Observable<any[]>;
  totale: number = 0;
  processing: boolean = false;
  
  // Dati del form di pagamento
  datiPagamento: DatiCheckout = {
    metodo_pagamento: 'carta_credito',
    nome_intestatario: '',
    numero_carta: ''
  };

  constructor(
    private carrelloService: CarrelloService,
    private acquistiService: AcquistiService,
    private router: Router
  ) {
    this.carrello$ = this.carrelloService.ottieniCarrello();
  }

  ngOnInit(): void { /*ngOnInit viene chiamato appena la pagina di checkout viene caricata.  */
    this.carrello$.subscribe(carrello => {
      if (carrello.length === 0) {
        // Se il carrello è vuoto, reindirizza al catalogo
        this.router.navigate(['/catalogo']);
        return;
      }
      this.totale = carrello.reduce((total, prodotto) => total + (prodotto.prezzo * prodotto.quantita), 0); /*calcola il totale dell'acquisto */
    });
  }

  validaForm(): boolean { /*valida i dati inseriti dall'utente nel form di pagamento */
    if (!this.datiPagamento.nome_intestatario.trim()) { /*.trim rimuove spazi all'inizio e alla fine della stringa */
      alert('Inserisci il nome dell\'intestatario');
      return false;
    }

    if (!this.datiPagamento.numero_carta.trim()) {
      alert('Inserisci il numero della carta');
      return false;
    }

    // Validazione base numero carta (16 cifre)
    const numeroSolo = this.datiPagamento.numero_carta.replace(/\s/g, '');
    if (!/^\d{16}$/.test(numeroSolo)) {
      alert('Il numero della carta deve contenere 16 cifre');
      return false;
    }

    return true;
  }

  processaAcquisto(): void { /*gestisce l’intera procedura di acquisto */
    if (!this.validaForm()) {
      return; // e la validazione fallisce, interrompe la procedura.
    }

    this.processing = true;

    this.acquistiService.processaCheckout(this.datiPagamento).subscribe({ //manda i dati di pagamento al servizio Acquisti.Service se la procedura di valid form va a buon fine
      next: (risultato) => {
        this.processing = false;
        if (risultato.success) {
          // Aggiorna il carrello (dovrebbe essere vuoto dopo l'acquisto)
          this.carrelloService.aggiornaDopoAcquisto();
          alert(`Acquisto completato con successo! Totale: €${risultato.totale}`);
          this.router.navigate(['/profilo'], { 
            queryParams: { tab: 'acquisti' } 
          });
        }
      },
      error: (err) => {
        this.processing = false;
        console.error('Errore checkout:', err);
        alert(err.error?.error || 'Errore durante il processo di acquisto');
      }
    });
  }

  tornaAlCarrello(): void { //usata nel html per tornare alla pagina del carrello
    this.router.navigate(['/carrello']);
  }

  formattaNumeroCarta(): void { 
    // Formatta il numero carta con spazi ogni 4 cifre
    let numero = this.datiPagamento.numero_carta.replace(/\s/g, '');
    let formatted = numero.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.datiPagamento.numero_carta = formatted;
  }
}