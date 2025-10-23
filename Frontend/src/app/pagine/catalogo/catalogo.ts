import { Component } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';
import { CatalogoService } from '../../services/catalogo.service';
import { SuggestedService } from '../../services/suggested.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
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
  
  // Nuove proprietà per la ricerca
  searchQuery: string = '';
  isSearchMode: boolean = false;
  
  constructor(
    private http: HttpClient, 
    private carrelloService: CarrelloService, 
    private route: ActivatedRoute, 
    private router: Router, 
    private catalogoService: CatalogoService, 
    private suggestedService: SuggestedService )
     {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        // Modalità ricerca
        this.searchQuery = params['search'];
        this.isSearchMode = true;
        this.eseguiRicerca(params['search']);
      } else if (params['prodottoId']) {
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
  caricaProdottoDettaglio(id: number) { //da barra di ricerca entra dentro i prodotti
    // Richiedi direttamente il prodotto dal backend per garantire che il dettaglio venga mostrato
    this.http.get<any>(`http://localhost:3000/api/catalogo/prodotto/${id}`).subscribe(
      prodotto => {
        if (prodotto) {
      
          this.prodottoSelezionato = prodotto;
          this.mostraCategorie = false;
          this.mostraProdotti = false;
          this.mostraDettaglio = true;
          this.suggestedService.salvaVisualizzazione(id).subscribe({
          next: () => {},
          error: (err) => console.error('Errore salvataggio visualizzazione:', err)
        });
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
  
  aggiungiAWishlist(prodotto: any): void {

  this.catalogoService.aggiungiAWishlist(prodotto);

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

  //carica tutti i prodotti appartenenti ad una categoria specifica (usa una get al backend)
  caricaProdottiCategoria(categoria: string) {  
    this.caricamento = true; //bug fix per caricamento footer flash
    this.http.get<any[]>(`http://localhost:3000/api/catalogo/prodotti/categoria/${categoria}`).subscribe(
      dati => {
        this.prodotti = dati; //Salva nell’array prodotti tutti i prodotti restituiti dal backend per quella categoria.
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

  eseguiRicerca(query: string) {
    this.caricamento = true;
    this.isSearchMode = true;
    this.mostraCategorie = false;
    this.mostraProdotti = true;
    this.mostraDettaglio = false;
    this.categoriaSelezionata = `Risultati per: "${query}"`;

    // Usa il nuovo endpoint di ricerca prodotti
    this.http.get<any[]>(`http://localhost:3000/api/catalogo/prodotti/ricerca?q=${encodeURIComponent(query)}`).subscribe( //encodeURIComponent(query): serve per avere url sicuri (es. non avere spazi)
      //Salva nell’array prodotti tutti i prodotti restituiti dalla ricerca (quelli che corrispondono alla query).
      prodotti => {  
        this.prodotti = prodotti;
        // Estrai marche disponibili dai risultati
        this.marcheDisponibili = Array.from(new Set(this.prodotti.map(p => p.marchio).filter(m => !!m)));
        this.marcaSelezionata = '';
        this.caricamento = false;
      },
      err => {
        console.error('Errore ricerca prodotti:', err);
        this.caricamento = false;
      }
    );
  }
  
  selezionaProdotto(prodotto: any) {
    this.prodottoSelezionato = prodotto; //mostra solo il dettaglio del prodotto selezionato
    this.mostraCategorie = false;
    this.mostraProdotti = false;
    this.mostraDettaglio = true;
    this.suggestedService.salvaVisualizzazione(this.prodottoSelezionato.id_prodotto).subscribe({
          next: () => {},
          error: (err) => console.error('Errore salvataggio visualizzazione:', err)
        });
    
  }
  
  tornaProdotti() {
    this.mostraCategorie = false;
    this.mostraProdotti = true;
    this.mostraDettaglio = false;
    this.prodottoSelezionato = null;
  }
  
  tornaAllaHome() {
    this.router.navigate(['/']);
  }
  
  tornaAlleCategorie() {
    // Se siamo in modalità ricerca, pulisci i parametri URL e torna alle categorie
    if (this.isSearchMode) {
      this.router.navigate(['/catalogo']);
      return;
    }
    
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
    this.searchQuery = '';
    this.isSearchMode = false;
  }
  
  get prodottiFiltrati() {
    if (!this.marcaSelezionata) {
      return this.prodotti;
    }
    return this.prodotti.filter(p => p.marchio === this.marcaSelezionata);
  }

  aggiungiAlCarrello(prodotto: any): void { //prodotto contiene tutte le info del prodotto selezionato (vedi caricaProdottiCategoria)
    // Controlla disponibilità prima di aggiungere
    if (prodotto.quantita_disponibile <= 0) {
      alert('Prodotto non disponibile!');
      return;
    }
    if (!this.carrelloService.isLoggedIn()) {
    // Guest: salva nel localStorage
    let carrello = this.carrelloService.getCarrelloGuest();
    const esiste = carrello.find(item => item.id_prodotto === prodotto.id_prodotto);
    if (esiste) {
      esiste.quantita += 1;
    } else {
      carrello.push({ id_prodotto: prodotto.id_prodotto, quantita: 1, ...prodotto });
    }
    this.carrelloService.setCarrelloGuest(carrello);
    alert('Prodotto aggiunto al carrello!');
    return;
  }
    
    this.carrelloService.aggiungiAlCarrello(prodotto.id_prodotto, 1).subscribe({ //aggungi 1 unità del prodotto al carrello
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
