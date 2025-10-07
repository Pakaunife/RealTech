import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HeaderMinimal } from '../header-minimal/header-minimal';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, HeaderMinimal, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  users: any[] = [];
  queryUtente: string = '';
  prodottoForm: any = {};
  prodotti: any[] = [];
  categorie: any[] = [];
  mostraFormProdotto = false;
  brandDisponibili: any[] = [];
  prodottoQuery: string = '';

  constructor(private http: HttpClient) {}

 get utentiFiltrati() {
  if (!this.queryUtente?.trim()) return this.users;
  const q = this.queryUtente.trim().toLowerCase();
  return this.users.filter(u =>
    u.nome.toLowerCase().includes(q) ||
    u.cognome.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  );
}

get prodottiFiltrati() {
  if (!this.prodottoQuery?.trim()) return this.prodotti;
  const q = this.prodottoQuery.trim().toLowerCase();
  return this.prodotti.filter(p =>
    p.nome.toLowerCase().includes(q) ||
    (p.descrizione && p.descrizione.toLowerCase().includes(q))
  );
}


apriFormProdotto() {
  this.prodottoForm = {
    nome: '',
    prezzo: null,
    descrizione: '',
    immagine: '',
    quantita_disponibile: null,
    id_categoria: '',
    id_marchio: '',
    in_vetrina: false,
    promo: false,
    bloccato: false
  };
  this.mostraFormProdotto = true;
}

  ngOnInit() {
    this.loadUsers();
    this.loadProdotti();
    this.loadCategorie();
    this.loadBrand();
  }

  loadUsers() {
    
    this.http.get<any[]>('http://localhost:3000/api/admin/users').subscribe({
    next: users => {
      console.log('Utenti ricevuti:', users); // <-- DEBUG
      this.users = users;
    },
    error: err => {
      console.error('Errore caricamento utenti:', err); // <-- DEBUG
    }
  });
  }

  loadProdotti() {
  this.http.get<any[]>('http://localhost:3000/api/products/load').subscribe({
    next: prodotti => this.prodotti = prodotti,
    error: err => { /* gestione errore */ }
  });
}


loadCategorie() {
  this.http.get<any[]>('http://localhost:3000/api/catalogo/prodotti').subscribe({
    next: categorie => this.categorie = categorie,
    error: err => { /* gestione errore */ }
  });
}

loadBrand() {
  this.http.get<any[]>('http://localhost:3000/api/catalogo/brand').subscribe({
    
    next: brands => this.brandDisponibili = brands,
    error: err => { /* gestione errore */ }
  });
}

modificaProdotto(prodotto: any) {
  this.prodottoForm = { ...prodotto, id: prodotto.id_prodotto };
  this.mostraFormProdotto = true;
}

bloccaProdotto(prodotto: any) {
  this.http.patch(`http://localhost:3000/api/products/${prodotto.id}/blocco`, { bloccato: !prodotto.bloccato }).subscribe({
    next: () => this.loadProdotti(),
    error: err => { /* gestione errore */ }
  });
}

salvaProdotto() {

  if (this.prodottoForm.id) {
    // MODIFICA
    this.http.put(`http://localhost:3000/api/products/${this.prodottoForm.id}`, this.prodottoForm)
      .subscribe({
        next: () => {
          this.mostraFormProdotto = false;
          this.prodottoForm = {};
          this.loadProdotti();
        },
        error: err => {
          alert('Errore durante la modifica del prodotto: ' + (err.error?.message || err.message));
        }
      });
  } else {
    // INSERIMENTO
    this.http.post('http://localhost:3000/api/products/insert', this.prodottoForm)
      .subscribe({
        next: () => {
          this.mostraFormProdotto = false;
          this.prodottoForm = {};
          this.loadProdotti();
        },
        error: err => {
          alert('Errore durante l\'inserimento del prodotto: ' + (err.error?.message || err.message));
        }
      });
  }
}

  toggleBlock(user: any) {
    if (!window.confirm(`Sei sicuro di voler ${user.is_blocked ? 'sbloccare' : 'bloccare'} l'utente ${user.nome} ${user.cognome}?`)) {
    return;
  }
    this.http.patch(`http://localhost:3000/api/admin/users/${user.id}/block`, {}).subscribe(() => this.loadUsers());
  }

  toggleAdmin(user: any) {
    if (!window.confirm(`Sei sicuro di voler ${user.is_admin ? 'rimuovere i privilegi admin a' : 'rendere admin'} ${user.nome} ${user.cognome}?`)) {
    return;
  }
    this.http.patch(`http://localhost:3000/api/admin/users/${user.id}/admin`, { makeAdmin: !user.is_admin }).subscribe(() => this.loadUsers());
  }
}
