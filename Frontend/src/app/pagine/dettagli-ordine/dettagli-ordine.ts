import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { DatePipe, NgIf, NgFor, LowerCasePipe, DecimalPipe, CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dettagli-ordine',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DatePipe, LowerCasePipe, DecimalPipe, RouterModule],
  templateUrl: './dettagli-ordine.html',
  styleUrls: ['./dettagli-ordine.css']
})
export class DettagliOrdine implements OnInit {
  ordine: any = null;
  prodotti: any[] = [];
  loading = true;
  
  // Proprietà calcolate per il riepilogo
  subtotale: number = 0;
  scontoApplicato: number = 0;
  totaleFinale: number = 0;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    const orderId = this.route.snapshot.params['id'];
    console.log('Caricamento ordine ID:', orderId);
    
    this.orderService.getDettaglioOrdine(orderId).subscribe({
      next: (data) => {
        console.log('Dati ricevuti dal backend:', data);
        this.ordine = data.ordine;
        this.prodotti = data.prodotti;
        
        
        this.calcolaRiepilogo();
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento ordine:', error);
        this.loading = false;
      }
    });
  }
  
  private calcolaRiepilogo() {
    // Calcola il subtotale dai prodotti
    this.subtotale = this.prodotti.reduce((total, prodotto) => {
      // per prezzo in caso promo fosse true 
      const prezzoUnitario = prodotto.prezzo_scontato != null ? Number(prodotto.prezzo_scontato) : (prodotto.prezzo || prodotto.prezzo_unitario || 0);
      const quantita = prodotto.quantita || 1;
      return total + (prezzoUnitario * quantita);
    }, 0);
    
    // Usa il totale dall'ordine
    this.totaleFinale = this.ordine?.totale || 0;
    
    // Calcola lo sconto
    if (this.ordine?.totale_originale && this.ordine.totale_originale > 0) {
      this.subtotale = this.ordine.totale_originale;
      this.scontoApplicato = this.ordine.sconto_applicato || 0;
    } else {
      // Se non abbiamo totale_originale, calcola lo sconto come differenza
      this.scontoApplicato = Math.max(0, this.subtotale - this.totaleFinale);
    }
    

  }
  
  // Metodo helper per ottenere il prezzo unitario
  getPrezzoUnitario(prodotto: any): number {
    return prodotto.prezzo_scontato != null ? Number(prodotto.prezzo_scontato) : (prodotto.prezzo || prodotto.prezzo_unitario || 0);
  }
  
  // Metodo helper per calcolare il subtotale di un prodotto
  getSubtotaleProdotto(prodotto: any): number {
    return this.getPrezzoUnitario(prodotto) * (prodotto.quantita || 1);
  }

  getMetodoPagamento(metodo: any): string {
  
  // Gestione più specifica dei casi null/undefined
  if (metodo === null || metodo === undefined) {
    console.log('Metodo pagamento null/undefined, ritorno "Non specificato"');
    return 'Non specificato';
  }
  
  // Converti in stringa se non lo è già
  const metodoStr = String(metodo).trim();
  
  if (metodoStr === '' || metodoStr === 'null' || metodoStr === 'undefined') {
    console.log('Metodo pagamento vuoto o stringa null/undefined, ritorno "Non specificato"');
    return 'Non specificato';
  }
  
  const metodiPagamento: { [key: string]: string } = {
    'carta_credito': 'Carta di Credito',
    'carta_debito': 'Carta di Debito', 
    'paypal': 'PayPal',
    'bonifico': 'Bonifico Bancario',
    'contrassegno': 'Contrassegno'
  };
  
  const metodoLower = metodoStr.toLowerCase();
  console.log('Metodo lowercase:', metodoLower);
  
  const risultato = metodiPagamento[metodoLower] || (metodoStr.charAt(0).toUpperCase() + metodoStr.slice(1));
  console.log('Risultato finale:', risultato);
  
  return risultato;
}

vaiAlTrackingOrdine() {
  this.router.navigate(['/tracking-ordine', this.ordine.id]);
}


tornaAListaOrdini() {
  this.router.navigate(['/ordini']); 
}
}