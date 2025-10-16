import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  private baseUrl = 'http://localhost:3000/api';
  users: any[] = [];
  queryUtente: string = '';
  prodottoForm: any = {};
  prodotti: any[] = [];
  categorie: any[] = [];
  mostraFormProdotto = false;
  brandDisponibili: any[] = [];
  prodottoQuery: string = '';
  selectedFile: File | null = null;
  immagineVecchia: string = '';
  categoriaSelezionata: string = '';
  brandSelezionato: string = '';
  ruoloUtenteSelezionato: string = '';

  mostraConfermaRimozione = false;
  prodottoDaRimuovere: any = null;

  utenteSelezionatoOrdini: any = null;
  ordiniUtenteSelezionato: any[] = [];
  mostraOrdiniUtente = false;

  mostraDettaglioOrdine = false;
  ordineDettaglio: any = null;
  prodottiOrdineDettaglio: any[] = [];

  paginaProdotti: number = 1;
  prodottiPerPagina: number = 10;
  
  paginaUtenti: number = 1;
  utentiPerPagina: number = 10;
  
  
  currentUser: any = null;

  constructor(private http: HttpClient, private adminService: AdminService, private authService: AuthService) {}



  get utentiPaginati() {
  const start = (this.paginaUtenti - 1) * this.utentiPerPagina;
  return this.utentiFiltrati.slice(start, start + this.utentiPerPagina);
}

get numeroPagineUtenti() {
  return Math.max(1, Math.ceil(this.utentiFiltrati.length / this.utentiPerPagina));
}

cambiaPaginaUtenti(pagina: number) {
  if (pagina < 1 || pagina > this.numeroPagineUtenti) return;
  this.paginaUtenti = pagina;
}

get prodottiPaginati() {
  const start = (this.paginaProdotti - 1) * this.prodottiPerPagina;
  return this.prodottiFiltrati.slice(start, start + this.prodottiPerPagina);
}

 get numeroPagineProdotti() {
  return Math.max(1, Math.ceil(this.prodottiFiltrati.length / this.prodottiPerPagina));
}

  cambiaPaginaProdotti(pagina: number) {
    this.paginaProdotti = pagina;
  }
  

get utentiFiltrati() {
  let utenti = this.users;

  // Filtro per ruolo se selezionato
  if (this.ruoloUtenteSelezionato) {
    utenti = utenti.filter(u => u.ruolo === this.ruoloUtenteSelezionato);
  }

  // Filtro per ricerca testuale
  if (this.queryUtente?.trim()) {
    const q = this.queryUtente.trim().toLowerCase();
    utenti = utenti.filter(u =>
      u.nome.toLowerCase().includes(q) ||
      u.cognome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }
  return utenti;
}

get prodottiFiltrati() {
  let prodotti = this.prodotti;

  if (this.categoriaSelezionata) {
    prodotti = prodotti.filter(p => p.id_categoria == this.categoriaSelezionata);
  }
  if (this.brandSelezionato) {
    prodotti = prodotti.filter(p => p.id_marchio == this.brandSelezionato);
  }
  if (this.prodottoQuery?.trim()) {
    const q = this.prodottoQuery.trim().toLowerCase();
    prodotti = prodotti.filter(p =>
      p.nome?.toLowerCase().includes(q) ||
      p.descrizione?.toLowerCase().includes(q) ||
      p.nome_categoria?.toLowerCase().includes(q) ||
      p.nome_marchio?.toLowerCase().includes(q)
    );
  }
  return prodotti;
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

chiudiFormProdotto() {
  this.mostraFormProdotto = false;
  this.prodottoForm = {};
  this.selectedFile = null;
}

onFileSelected(event: any) {
  this.selectedFile = event.target.files[0];
}

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    this.loadUsers();
    this.loadProdotti();
    this.loadCategorie();
    this.loadBrand();
  }

  visualizzaOrdiniUtente(utente: any) {
    console.log('Visualizzazione ordini per utente:', utente);
    this.utenteSelezionatoOrdini = utente;
    this.mostraOrdiniUtente = true;
    this.mostraDettaglioOrdine = false; // Chiudi il dettaglio se aperto
    
    // Usa il metodo esistente di AdminService
    this.adminService.getOrdiniUtente(utente.id).subscribe({
      next: (ordini) => {
        console.log('Ordini ricevuti:', ordini);
        this.ordiniUtenteSelezionato = ordini;
      },
      error: (error) => {
        console.error('Errore nel caricamento ordini utente:', error);
        alert('Errore nel caricamento degli ordini dell\'utente');
      }
    });
  }

  chiudiOrdiniUtente() {
    this.mostraOrdiniUtente = false;
    this.utenteSelezionatoOrdini = null;
    this.ordiniUtenteSelezionato = [];
    this.chiudiDettaglioOrdine(); // Chiudi anche il dettaglio
  }

  // METODI PER DETTAGLIO ORDINE SPECIFICO
  visualizzaDettaglioOrdineDaUtente(ordine: any) {
    console.log('Visualizzazione dettaglio ordine da utente:', ordine);
    this.visualizzaDettaglioOrdine(ordine);
  }

  visualizzaDettaglioOrdine(ordine: any) {
    console.log('Visualizzazione dettaglio ordine:', ordine);
    this.mostraDettaglioOrdine = true;
    
    // Usa il metodo esistente di AdminService
    this.adminService.getDettaglioOrdineAdmin(ordine.id).subscribe({
      next: (dettaglio) => {
        console.log('Dettaglio ordine ricevuto:', dettaglio);
        this.ordineDettaglio = dettaglio.ordine;
        this.prodottiOrdineDettaglio = dettaglio.prodotti;
      },
      error: (error) => {
        console.error('Errore nel caricamento dettaglio ordine:', error);
        alert('Errore nel caricamento del dettaglio dell\'ordine');
      }
    });
  }

  chiudiDettaglioOrdine() {
    this.mostraDettaglioOrdine = false;
    this.ordineDettaglio = null;
    this.prodottiOrdineDettaglio = [];
  }

  tornaAOrdiniUtente() {
    this.chiudiDettaglioOrdine();
    
  }

  cambiaStatoOrdine(ordine: any, nuovoStato: string) {
    console.log(`Cambio stato ordine ${ordine.id} da ${ordine.stato} a ${nuovoStato}`);
    
    this.adminService.aggiornaStatoOrdine(ordine.id, nuovoStato).subscribe({
      next: (response) => {
        console.log('Stato ordine aggiornato:', response);
        ordine.stato = nuovoStato;
        
        // Aggiorna anche nell'array degli ordini utente
        const ordineIndex = this.ordiniUtenteSelezionato.findIndex(o => o.id === ordine.id);
        if (ordineIndex !== -1) {
          this.ordiniUtenteSelezionato[ordineIndex].stato = nuovoStato;
        }
        
        // Aggiorna anche il dettaglio se è aperto
        if (this.ordineDettaglio && this.ordineDettaglio.id === ordine.id) {
          this.ordineDettaglio.stato = nuovoStato;
        }
        
        alert(`Ordine #${ordine.id} aggiornato a: ${nuovoStato}`);
      },
      error: (error) => {
        console.error('Errore nell\'aggiornamento stato ordine:', error);
        alert('Errore nell\'aggiornamento dello stato dell\'ordine');
      }
    });
  }

  // METODI PER CALCOLI STATISTICHE
  calcolaTotaleSpeso(): number {
    return this.ordiniUtenteSelezionato.reduce((total, ordine) => total + parseFloat(ordine.totale), 0);
  }

  calcolaOrdineMedio(): number {
    if (this.ordiniUtenteSelezionato.length === 0) return 0;
    return this.calcolaTotaleSpeso() / this.ordiniUtenteSelezionato.length;
  }

  getUltimoOrdine(): Date | null {
    if (this.ordiniUtenteSelezionato.length === 0) return null;
    const ordini = [...this.ordiniUtenteSelezionato].sort((a, b) => 
      new Date(b.data_ordine).getTime() - new Date(a.data_ordine).getTime()
    );
    return new Date(ordini[0].data_ordine);
  }

  getStatoClass(stato: string): string {
    switch (stato?.toLowerCase()) {
      case 'in lavorazione':
        return 'status-lavorazione';
      case 'spedito':
        return 'status-spedito';
      case 'in transito':
        return 'status-transito';
      case 'in consegna':
        return 'status-in-consegna';
      case 'consegnato':
        return 'status-consegnato';
      case 'annullato':
        return 'status-annullato';
      default:
        return 'status-default';
    }
  }

  loadUsers() {
    this.adminService.getStatisticheUtenti().subscribe({
    next: users => {
      
      this.users = users;
    },
    error: err => {
      console.error(err); // <-- DEBUG
    }
  });
  }

  loadProdotti() {
  this.http.get<any[]>(`${this.baseUrl}/products/load`).subscribe({
    next: prodotti => this.prodotti = prodotti,
    error: err => {  console.error(err); }
  });
}


loadCategorie() {
  this.http.get<any[]>(`${this.baseUrl}/catalogo/prodotti`).subscribe({
    next: categorie => this.categorie = categorie,
    error: err => {  console.error(err); }
  });
}

loadBrand() {
  this.http.get<any[]>(`${this.baseUrl}/catalogo/brand`).subscribe({
    
    next: brands => this.brandDisponibili = brands,
    error: err => { /* gestione errore */ }
  });
}

modificaProdotto(prodotto: any) {
  this.prodottoForm = { ...prodotto, id: prodotto.id_prodotto };
  this.mostraFormProdotto = true;
  setTimeout(() => {
    const el = document.getElementById('form-prodotto');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);

}



bloccaProdotto(prodotto: any) {
  this.http.patch(`${this.baseUrl}/products/${prodotto.id}/blocco`, { bloccato: !prodotto.bloccato }).subscribe({
    next: () => this.loadProdotti(),
    error: err => { /* gestione errore */ }
  });
}

salvaProdotto() {
  
  if (this.prodottoForm.id) {
    this.immagineVecchia = this.prodottoForm.immagine;
    this.uploadAndInviaProdotto();
    return;
  }

    this.http.get<any[]>(`${this.baseUrl}/products?nome=${encodeURIComponent(this.prodottoForm.nome)}`)
    .subscribe({
      next: prodottiEsistenti => {
        if (prodottiEsistenti && prodottiEsistenti.length > 0) {
          const prodotto = prodottiEsistenti[0];
          this.modificaProdotto(prodotto);
          alert('Prodotto già presente. Puoi modificarlo.');
          return;
        }
        this.uploadAndInviaProdotto();
      },
      error: err => {
        alert('Errore durante la verifica del prodotto: ' + (err.error?.message || err.message));
      }
    });
  } 
      
      
    
  uploadAndInviaProdotto() {
    console.log('uploadAndInviaProdotto chiamato');
  console.log('selectedFile:', this.selectedFile); 
  if (this.selectedFile) {
     console.log('Tentativo upload file:', this.selectedFile.name);
    // Se è stata selezionata una nuova immagine, caricala prima
    const formData = new FormData();
    formData.append('immagine', this.selectedFile);

    console.log('Invio richiesta upload a backend...');
    this.http.post<{ filename: string }>(`${this.baseUrl}/immagine/upload`, 
      formData,{ headers: { 'x-file-name': this.selectedFile.name } })
      .subscribe({
        next: res => {
          console.log('Risposta upload:', res);
          this.prodottoForm.immagine = res.filename;
          this.inviaProdotto();
        },
        error: err => alert('Errore upload immagine: ' + (err.error?.message || err.message))
      });
  } else {
    // Nessuna nuova immagine, aggiorna solo i dati
    this.inviaProdotto();
  }
}





inviaProdotto() {

  if (this.prodottoForm.id) {
    // MODIFICA
    this.http.put(`${this.baseUrl}/products/${this.prodottoForm.id}`,{ ...this.prodottoForm,
      immagineVecchia: this.immagineVecchia
    })
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
    this.http.post(`${this.baseUrl}/products/insert`, this.prodottoForm)
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
    this.http.patch(`${this.baseUrl}/admin/users/${user.id}/block`, {}).subscribe(() => this.loadUsers());
  }

  toggleAdmin(user: any) {
    const nuovoRuolo = user.ruolo === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Sei sicuro di voler ${user.is_admin ? 'rimuovere i privilegi admin a' : 'rendere admin'} ${user.nome} ${user.cognome}?`)) {
    return;
  }
    this.http.patch(`${this.baseUrl}/admin/users/${user.id}/admin`, { ruolo: nuovoRuolo })
    .subscribe(() => this.loadUsers());
  }

   rimuoviProdotto(prodotto: any) {
    console.log('Richiesta rimozione prodotto:', prodotto);
    this.prodottoDaRimuovere = prodotto;
    this.mostraConfermaRimozione = true;
  }
   
  confermarimozione() {
    if (!this.prodottoDaRimuovere) return;
    
    console.log('Conferma rimozione prodotto ID:', this.prodottoDaRimuovere.id_prodotto);
    
    this.adminService.rimuoviProdotto(this.prodottoDaRimuovere.id_prodotto).subscribe({
      next: (response) => {
        console.log('Prodotto rimosso con successo:', response);
        
        // Rimuovi il prodotto dall'array locale
        this.prodotti = this.prodotti.filter(p => p.id_prodotto !== this.prodottoDaRimuovere.id_prodotto);
        
        // Chiudi il modal
        this.annullaRimozione();
        
        // Mostra messaggio di successo
        alert('Prodotto rimosso con successo!');
      },
      error: (error) => {
        console.error('Errore nella rimozione del prodotto:', error);
        alert('Errore nella rimozione del prodotto. Riprova più tardi.');
      }
    });
  }
   annullaRimozione() {
    this.mostraConfermaRimozione = false;
    this.prodottoDaRimuovere = null;
  }

}
