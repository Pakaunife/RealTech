import { Component } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';

@Component({
  selector: 'app-catalogo',
  imports: [CommonModule, NgIf, NgFor, FormsModule],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css']
})
export class Catalogo {
  arrivoDaHome: boolean = false;
  categorie: any[] = [];
  prodotti: any[] = [];
  prodottoSelezionato: any = null;
  
  // Gestione stati, ariabili booleane per gestire quale sezione mostrare nella pagina.
  mostraCategorie: boolean = true;
  mostraProdotti: boolean = false;
  mostraDettaglio: boolean = false;
  categoriaSelezionata: string = '';
  marcaSelezionata: string = '';
  marcheDisponibili: string[] = [];
  caricamento: boolean = true;
  constructor(private http: HttpClient, private carrelloService: CarrelloService, private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe(params => {
      if (params['prodottoId']) {
        this.arrivoDaHome = true;
        this.caricaProdottoDettaglio(params['prodottoId']);
      } else {
        // Reset completo dello stato quando non ci sono parametri
        this.resetStato();
        this.arrivoDaHome = false;
        this.caricaCategorie();
      }
    });
  }
  caricaProdottoDettaglio(id: number) {
    this.http.get<any[]>(`http://localhost:3000/api/catalogo/popular?limit=1000`).subscribe(
      prodotti => {
        const prodotto = prodotti.find(p => p.id_prodotto == id);
        if (prodotto) {
          // L'URL dell'immagine è già costruito nell'endpoint catalogo
          this.prodottoSelezionato = prodotto;
          this.mostraCategorie = false;
          this.mostraProdotti = false;
          this.mostraDettaglio = true;
        } else {
          this.caricaCategorie();
        }
      },
      err => {
        console.error('Errore caricamento prodotto:', err);
        this.caricaCategorie();
      }
    );
  }
  
  caricaCategorie() {
    this.caricamento = true; //bug fix per caricamento footer flash
    this.http.get<any[]>('http://localhost:3000/api/catalogo/prodotti').subscribe(
      dati => {
        this.categorie = dati;
        this.caricamento = false;
      },
      err => {
        console.error('Errore caricamento categorie:', err);
        this.caricamento = false;
      }
    );
  }
  
  selezionaCategoria(nomeCategoria: string) {
    this.categoriaSelezionata = nomeCategoria;
    this.mostraCategorie = false;
    this.mostraProdotti = true;
    this.mostraDettaglio = false;
    this.caricaProdottiCategoria(nomeCategoria);
  }

  caricaProdottiCategoria(categoria: string) {  
    this.caricamento = true; //bug fix per caricamento footer flash
    this.http.get<any[]>(`http://localhost:3000/api/catalogo/prodotti/categoria/${categoria}`).subscribe(
      dati => {
        this.prodotti = dati;
        // Estrai marche disponibili dai prodotti
        this.marcheDisponibili = Array.from(new Set(dati.map(p => p.marchio).filter(m => !!m)));
        this.marcaSelezionata = ''; // Reset filtro marca
        this.caricamento = false;
      },
      err => {
        console.error('Errore caricamento prodotti:', err);
        this.caricamento = false;
      }
    );
  }
  
  selezionaProdotto(prodotto: any) {
    this.prodottoSelezionato = prodotto;
    this.mostraCategorie = false;
    this.mostraProdotti = false;
    this.mostraDettaglio = true;
  }
  
  tornaProdotti() {
    this.mostraCategorie = false;
    this.mostraProdotti = true;
    this.mostraDettaglio = false;
    this.prodottoSelezionato = null;
  }
  
  tornaAlleCategorie() {
    this.mostraCategorie = true;
    this.mostraProdotti = false;
    this.mostraDettaglio = false;
    this.prodotti = [];
    this.prodottoSelezionato = null;
    this.categoriaSelezionata = '';
    this.marcaSelezionata = '';
    this.marcheDisponibili = [];
  }

  resetStato() {
    this.mostraCategorie = true;
    this.mostraProdotti = false;
    this.mostraDettaglio = false;
    this.prodotti = [];
    this.prodottoSelezionato = null;
    this.categoriaSelezionata = '';
    this.marcaSelezionata = '';
    this.marcheDisponibili = [];
    this.arrivoDaHome = false;
  }
  
  get prodottiFiltrati() {
    if (!this.marcaSelezionata) {
      return this.prodotti;
    }
    return this.prodotti.filter(p => p.marchio === this.marcaSelezionata);
  }

  aggiungiAlCarrello(prodotto: any): void {
    // Controlla disponibilità prima di aggiungere
    if (prodotto.quantita_disponibile <= 0) {
      alert('Prodotto non disponibile!');
      return;
    }
    
    this.carrelloService.aggiungiAlCarrello(prodotto.id_prodotto, 1).subscribe({
      next: () => {
        alert('Prodotto aggiunto al carrello!');
      },
      error: (err) => {
        console.error('Errore:', err);
        alert('Errore nell\'aggiungere il prodotto al carrello');
      }
    });
  }
}
