import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { DatePipe, NgIf, NgFor, LowerCasePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-dettagli-ordine',
  templateUrl: './dettagli-ordine.html',
  styleUrls: ['./dettagli-ordine.css'],
  imports: [NgIf, NgFor, DatePipe, LowerCasePipe, DecimalPipe]
})
export class DettagliOrdine implements OnInit {
  ordine: any;
  prodotti: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    const orderId = this.route.snapshot.params['id'];
    this.orderService.getDettaglioOrdine(orderId).subscribe({
      next: (data) => {
        this.ordine = data.ordine;
        this.prodotti = data.prodotti;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}