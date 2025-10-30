import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { DatePipe, NgIf, NgFor, LowerCasePipe, CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-ordini',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DatePipe, LowerCasePipe, RouterModule],
  templateUrl: './ordini.html',
  styleUrls: ['./ordini.css']
})
export class Ordini implements OnInit {
  ordini: any[] = [];
  loading = true;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();
    this.orderService.getOrdiniUtente(user.id).subscribe({
      next: (data) => { this.ordini = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  vaiADettaglio(id: number) {
    this.router.navigate(['/dettagli-ordine', id]);
  }
  vaiANuovoOrdine() {
    this.router.navigate(['/catalogo']);
  }
  vaiAProfilo() {
    this.router.navigate(['/profilo']);
  }
}