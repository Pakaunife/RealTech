import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { NgIf, NgFor, DatePipe } from '@angular/common';

@Component({
  selector: 'app-tracking-ordine',
  templateUrl: './tracking-ordine.html',
  styleUrl: './tracking-ordine.css',
  imports: [NgIf, NgFor, DatePipe]
})
export class TrackingOrdine implements OnInit {
  ordine: any = null;
  statoOrdine: string = '';
  statiPossibili = ['In preparazione', 'Spedito', 'In transito', 'In consegna', 'Consegnato'];
  trackingNonDisponibile: boolean = false;
  caricamento: boolean = true;  



  constructor(private route: ActivatedRoute, private orderService: OrderService) {}

 ngOnInit() {
    const idOrdine = this.route.snapshot.paramMap.get('id');
    if (idOrdine) {
      this.orderService.getTrackingOrdine(idOrdine).subscribe({
        next: (data) => {
           console.log('Dati tracking ricevuti:', data);
          this.ordine = data;
          this.statoOrdine = data.stato;
          this.trackingNonDisponibile = false;
          this.caricamento = false;
        },
        error: (err) => {
          if (err.status === 404) 
            {
            this.trackingNonDisponibile = true;
            }
          this.caricamento = false;
        }
      });
    } else {
      this.trackingNonDisponibile = true;
      this.caricamento = false;
      console.error('Order ID is missing in route parameters.');
    }
  }

  getDettagliPaccoHtml(): string {
  return this.ordine?.dettagli_pacco
    ? this.ordine.dettagli_pacco.replace(/\n/g, '<br>')
    : '';
}

  get progresso() {
    return this.statiPossibili.indexOf(this.statoOrdine) / (this.statiPossibili.length - 1) * 100;
  }
}