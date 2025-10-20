import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { NgFor, DecimalPipe, NgIf } from '@angular/common';
import { WishListService } from '../../services/wishlistService';
import { Router } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css'],
  imports: [NgFor, NgIf,FormsModule, DecimalPipe]
})
export class Wishlist implements OnInit {
  wishlist: any[] = [];
  loading = true;
  selectedIds: number[] = [];

  constructor(private wishlistService: WishListService, private auth: AuthService,  private router: Router, private carrelloService: CarrelloService) {}

   ngOnInit() {
    this.loading = true;
    const userId = this.auth.getUserId(); // Assumes getUserId() returns the current user's ID
    if (userId !== null && userId !== undefined) {
      this.wishlistService.getWishlist(userId).subscribe({
       next: (prodotti) => {
  
            this.wishlist = prodotti.map(p => ({ ...p, selezionato: false }));
            this.loading = false;
          },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  toggleSelection(id: number) {
  if (this.selectedIds.includes(id)) {
    this.selectedIds = this.selectedIds.filter(selId => selId !== id);
  } else {
    this.selectedIds.push(id);
  }
}

aggiungiSelezionatiAlCarrello() {
  const idsDaAggiungere = [...this.selectedIds];
  let operazioniCompletate = 0;

  idsDaAggiungere.forEach(id => {
    this.carrelloService.aggiungiAlCarrello(id, 1).subscribe(() => {
      this.wishlistService.rimuovi(id).subscribe(() => {
        this.wishlist = this.wishlist.filter(p => p.id !== id);
        operazioniCompletate++;
       
        if (operazioniCompletate === idsDaAggiungere.length) {
          this.router.navigate(['/carrello']);
        }
      });
    });
  });

  this.selectedIds = [];
}

mostraProdotto(prodottoId: number) {
  this.router.navigate(['/catalogo'], { queryParams: { prodottoId } });
}

aggiungiAlCarrello(prodottoId: number) {
  this.carrelloService.aggiungiAlCarrello(prodottoId, 1).subscribe(() => {
    this.wishlistService.rimuovi(prodottoId).subscribe(() => {
      this.wishlist = this.wishlist.filter(p => p.id !== prodottoId);
    });
  });
}


  remove(prodottoId: number) {
    this.wishlistService.rimuovi(prodottoId).subscribe(() => {
      this.wishlist = this.wishlist.filter(w => w.id !== prodottoId);
    });
  }
}
