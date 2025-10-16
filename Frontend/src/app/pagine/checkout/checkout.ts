import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';
import { AcquistiService, DatiCheckout } from '../../services/acquisti.service';
import { UserService } from '../../services/user.service'; // <-- usa UserService
import { AuthService } from '../../services/auth.service';
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
  
  // Indirizzi
  indirizzi: any[] = [];
  indirizzoSelezionato: number | null = null;
  mostraFormNuovoIndirizzo = false;
  nuovoIndirizzo = {
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    telefono: ''
  };
  
  // Dati del form di pagamento
  datiPagamento: DatiCheckout = {
    metodo_pagamento: 'carta_credito',
    nome_intestatario: '',
    numero_carta: '',
    scadenza: '',
    cvv: ''
  };

  constructor(
    private carrelloService: CarrelloService,
    private acquistiService: AcquistiService,
    private userService: UserService, // <-- usa UserService invece di IndirizziService
    private authService: AuthService,
    private router: Router,
    private couponService: CouponService
  ) {
    this.carrello$ = this.carrelloService.ottieniCarrello();
  }

  ngOnInit(): void {
    this.carrello$.subscribe(carrello => {
      if (carrello.length === 0) {
        this.router.navigate(['/catalogo']);
        return;
      }
      
      this.totaleOriginale = carrello.reduce((total, prodotto) => {
        return total + (prodotto.prezzo * prodotto.quantita);
      }, 0);
      
      if (!this.couponApplicato) {
        this.totaleScontato = this.totaleOriginale;
      }
    });

    // Carica gli indirizzi dell'utente
    this.caricaIndirizzi();
  }

  caricaIndirizzi(): void {
    this.userService.getAddresses().subscribe({
      next: (indirizzi: any[]) => {
        this.indirizzi = indirizzi;
        // Se c'è solo un indirizzo, selezionalo automaticamente
        if (this.indirizzi.length === 1) {
          this.selezionaIndirizzo(this.indirizzi[0]);
        }
      },
      error: (err: any) => console.error('Errore caricamento indirizzi:', err)
    });
  }

  selezionaIndirizzo(indirizzo: any): void {
    this.indirizzoSelezionato = indirizzo.id;
    this.mostraFormNuovoIndirizzo = false;
  }

  mostraNuovoIndirizzo(): void {
    this.mostraFormNuovoIndirizzo = true;
    this.indirizzoSelezionato = null;
  }

  annullaNuovoIndirizzo(): void {
    this.mostraFormNuovoIndirizzo = false;
    this.resetNuovoIndirizzo();
  }

  validaNuovoIndirizzo(): boolean {
    return !!(
      this.nuovoIndirizzo.nome.trim() &&
      this.nuovoIndirizzo.indirizzo.trim() &&
      this.nuovoIndirizzo.citta.trim() &&
      this.nuovoIndirizzo.cap.trim() &&
      this.nuovoIndirizzo.provincia.trim() &&
      this.nuovoIndirizzo.telefono.trim()
    );
  }

  salvaIndirizzo(): void {
    if (!this.validaNuovoIndirizzo()) return;

    this.userService.addAddress(this.nuovoIndirizzo).subscribe({
      next: (nuovoIndirizzo: any) => {
        this.indirizzi.push(nuovoIndirizzo);
        this.selezionaIndirizzo(nuovoIndirizzo);
        this.resetNuovoIndirizzo();
        alert('Indirizzo salvato con successo!');
      },
      error: (err: any) => {
        console.error('Errore salvataggio indirizzo:', err);
        alert('Errore nel salvataggio dell\'indirizzo');
      }
    });
  }

  modificaIndirizzo(indirizzo: any, event: Event): void {
    event.stopPropagation();
    // Popola il form con i dati dell'indirizzo esistente
    this.nuovoIndirizzo = { ...indirizzo };
    this.mostraFormNuovoIndirizzo = true;
    this.indirizzoSelezionato = null;
  }

  eliminaIndirizzo(indirizzoId: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Sei sicuro di voler eliminare questo indirizzo?')) {
      this.userService.deleteAddress(indirizzoId).subscribe({
        next: () => {
          this.indirizzi = this.indirizzi.filter(i => i.id !== indirizzoId);
          if (this.indirizzoSelezionato === indirizzoId) {
            this.indirizzoSelezionato = null;
          }
          alert('Indirizzo eliminato con successo!');
        },
        error: (err: any) => {
          console.error('Errore eliminazione indirizzo:', err);
          alert('Errore nell\'eliminazione dell\'indirizzo');
        }
      });
    }
  }

  haIndirizzoSelezionato(): boolean {
    return this.indirizzoSelezionato !== null || this.validaNuovoIndirizzo();
  }

  private resetNuovoIndirizzo(): void {
    this.nuovoIndirizzo = {
      nome: '',
      indirizzo: '',
      citta: '',
      cap: '',
      provincia: '',
      telefono: ''
    };
  }

  private getIndirizzoCompleto(): string {
    if (this.indirizzoSelezionato) {
      const indirizzo = this.indirizzi.find(i => i.id === this.indirizzoSelezionato);
      if (indirizzo) {
        return `${indirizzo.indirizzo}, ${indirizzo.citta} ${indirizzo.cap}, ${indirizzo.provincia}`;
      }
    } else if (this.validaNuovoIndirizzo()) {
      return `${this.nuovoIndirizzo.indirizzo}, ${this.nuovoIndirizzo.citta} ${this.nuovoIndirizzo.cap}, ${this.nuovoIndirizzo.provincia}`;
    }
    return '';
  }

  validaForm(): boolean {
    if (!this.haIndirizzoSelezionato()) {
      alert('Seleziona un indirizzo di consegna');
      return false;
    }

    if (!this.datiPagamento.nome_intestatario.trim()) {
      alert('Inserisci il nome dell\'intestatario');
      return false;
    }

    if (!this.datiPagamento.numero_carta.trim()) {
      alert('Inserisci il numero della carta');
      return false;
    }

    const numeroSolo = this.datiPagamento.numero_carta.replace(/\s/g, '');
    if (!/^\d{16}$/.test(numeroSolo)) {
      alert('Il numero della carta deve contenere 16 cifre');
      return false;
    }

    if (!this.datiPagamento.scadenza.trim()) {
      alert('Inserisci la scadenza della carta');
      return false;
    }

    if (!this.datiPagamento.cvv.trim()) {
      alert('Inserisci il CVV della carta');
      return false;
    }

    return true;
  }

  processaAcquisto(): void {
    if (!this.validaForm()) {
      return;
    }

    this.processing = true;

    if (this.couponApplicato) {
      this.couponService.usaCoupon(this.couponCorrente.id).subscribe();
    }


   const datiCompleti = {
    ...this.datiPagamento,
    totale: this.totaleScontato,
    totale_originale: this.totaleOriginale,     
    sconto_applicato: this.scontoApplicato,     
    coupon_applicato: this.couponApplicato ? this.couponCorrente : null,
    indirizzo_consegna: this.getIndirizzoCompleto()
  };

    this.acquistiService.processaCheckout(datiCompleti).subscribe({
      next: (risultato: any) => {
        this.processing = false;
        if (risultato.success) {
          this.carrelloService.aggiornaDopoAcquisto();
          alert(`Acquisto completato con successo! Totale: €${this.totaleScontato.toFixed(2)}`);
          this.router.navigate(['/profilo'], { 
            queryParams: { tab: 'acquisti' } 
          });
        }
      },
      error: (err: any) => {
        this.processing = false;
        console.error('Errore checkout:', err);
        alert(err.error?.error || 'Errore durante il processo di acquisto');
      }
    });
  }

  tornaAlCarrello(): void {
    this.router.navigate(['/carrello']);
  }

  formattaScadenza(): void {
  let valore = this.datiPagamento.scadenza.replace(/\D/g, ''); // Solo numeri
  if (valore.length >= 2) {
    valore = valore.substring(0, 2) + '/' + valore.substring(2, 4);
  }
  this.datiPagamento.scadenza = valore;
}

  formattaNumeroCarta(): void { 
    let numero = this.datiPagamento.numero_carta.replace(/\s/g, '');
    let formatted = numero.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.datiPagamento.numero_carta = formatted;
  }

  applicaCoupon(): void {
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

  rimuoviCoupon(): void {
    this.resetCoupon();
    this.codiceCoupon = '';
    this.messaggioCoupon = '';
  }

  private resetCoupon(): void {
    this.couponApplicato = false;
    this.couponCorrente = null;
    this.scontoApplicato = 0;
    this.totaleScontato = this.totaleOriginale;
  }
}