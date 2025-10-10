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

  ngOnInit(): void {
    this.carrello$.subscribe(carrello => {
      if (carrello.length === 0) {
        // Se il carrello è vuoto, reindirizza al catalogo
        this.router.navigate(['/catalogo']);
        return;
      }
      this.totale = carrello.reduce((total, prodotto) => total + (prodotto.prezzo * prodotto.quantita), 0);
    });
  }

  validaForm(): boolean {
    if (!this.datiPagamento.nome_intestatario.trim()) {
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

  processaAcquisto(): void {
    if (!this.validaForm()) {
      return;
    }

    this.processing = true;

    this.acquistiService.processaCheckout(this.datiPagamento).subscribe({
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

  tornaAlCarrello(): void {
    this.router.navigate(['/carrello']);
  }

  formatNumeroCarla(): void {
    // Formatta il numero carta con spazi ogni 4 cifre
    let numero = this.datiPagamento.numero_carta.replace(/\s/g, '');
    let formatted = numero.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.datiPagamento.numero_carta = formatted;
  }
}