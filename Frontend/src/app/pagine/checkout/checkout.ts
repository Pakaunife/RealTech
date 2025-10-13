import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';
import { AcquistiService, DatiCheckout } from '../../services/acquisti.service';
import { Observable } from 'rxjs';
import { CouponService, CouponResponse } from '../../services/coupon.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class Checkout implements OnInit {
  carrello$: Observable<any[]>;
  processing: boolean = false;
  
  // Coupon
  codiceCoupon = '';
  couponApplicato = false;
  couponValido = false;
  couponCorrente: any = null;
  scontoApplicato = 0;
  messaggioCoupon = '';
  loading = false;
  
  // Totali
  totaleOriginale = 0;
  totaleScontato = 0;
  
  // Dati del form di pagamento
  datiPagamento: DatiCheckout = {
    metodo_pagamento: 'carta_credito',
    nome_intestatario: '',
    numero_carta: ''
  };

  constructor(
    private carrelloService: CarrelloService,
    private acquistiService: AcquistiService,
    private router: Router,
    private couponService: CouponService
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
      
      // Calcola il totale originale dal carrello
      this.totaleOriginale = carrello.reduce((total, prodotto) => {
        return total + (prodotto.prezzo * prodotto.quantita);
      }, 0);
      
      // Se non c'è coupon applicato, totaleScontato = totaleOriginale
      if (!this.couponApplicato) {
        this.totaleScontato = this.totaleOriginale;
      }
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

    // Se c'è un coupon applicato, incrementa il contatore
    if (this.couponApplicato) {
      this.couponService.usaCoupon(this.couponCorrente.id).subscribe();
    }

    // Passa il totale scontato al servizio acquisti
    const datiCompleti = {
      ...this.datiPagamento,
      totale: this.totaleScontato,
      coupon_applicato: this.couponApplicato ? this.couponCorrente : null
    };

    this.acquistiService.processaCheckout(datiCompleti).subscribe({
      next: (risultato) => {
        this.processing = false;
        if (risultato.success) {
          // Aggiorna il carrello (dovrebbe essere vuoto dopo l'acquisto)
          this.carrelloService.aggiornaDopoAcquisto();
          alert(`Acquisto completato con successo! Totale: €${this.totaleScontato.toFixed(2)}`);
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

  formattaNumeroCarta(): void { 
    // Formatta il numero carta con spazi ogni 4 cifre
    let numero = this.datiPagamento.numero_carta.replace(/\s/g, '');
    let formatted = numero.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.datiPagamento.numero_carta = formatted;
  }

  applicaCoupon() {
    if (!this.codiceCoupon.trim()) return;

    this.loading = true;
    this.couponService.verificaCoupon(this.codiceCoupon, this.totaleOriginale).subscribe({
      next: (response: CouponResponse) => {
        this.loading = false;
        this.couponValido = response.valido;
        this.messaggioCoupon = response.messaggio;

        if (response.valido) {
          this.couponApplicato = true;
          this.couponCorrente = response.coupon;
          this.scontoApplicato = response.sconto || 0;
          this.totaleScontato = response.totale_scontato || this.totaleOriginale;
        } else {
          this.resetCoupon();
        }
      },
      error: () => {
        this.loading = false;
        this.couponValido = false;
        this.messaggioCoupon = 'Errore nella verifica del coupon';
        this.resetCoupon();
      }
    });
  }

  rimuoviCoupon() {
    this.resetCoupon();
    this.codiceCoupon = '';
    this.messaggioCoupon = '';
  }

  private resetCoupon() {
    this.couponApplicato = false;
    this.couponCorrente = null;
    this.scontoApplicato = 0;
    this.totaleScontato = this.totaleOriginale;
  }
}