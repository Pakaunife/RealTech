import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css'],
  imports: [CurrencyPipe, NgFor, NgIf]
})
export class WishlistComponent implements OnInit {
  wishlist: any[] = [];
  loading = true;

  constructor(private wishlistService: UserService, private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.getUser();
    this.wishlistService.getWishlist().subscribe({
      next: data => { this.wishlist = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  remove(id: number) {
    this.wishlistService.removeFromWishlist(id).subscribe(() => {
      this.wishlist = this.wishlist.filter(w => w.id !== id);
    });
  }
}