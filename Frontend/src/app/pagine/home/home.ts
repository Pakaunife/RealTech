import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { CatalogoService } from '../../services/catalogo.service';
import { PacchettiService, Pacchetto } from '../../services/pacchetti.service';
import { CarrelloService } from '../../services/carrello.service';

@Component({
  selector: 'app-home',
  imports: [ CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

    user: any;
    showWelcome = false;
    prodottiInEvidenza: any[] = [];
    pacchetti: Pacchetto[] = [];
    loading = true;
    loadingPacchetti = true;
    error = '';
    errorPacchetti = '';

  constructor(
    public auth: AuthService,
    private catalogoService: CatalogoService,
    private pacchettiService: PacchettiService,
    private carrelloService: CarrelloService,
    private router: Router
  ) {
    this.user = this.auth.getUser();
  }
  vaiAlDettaglioProdotto(prodotto: any) {
    this.router.navigate(['/catalogo'], { queryParams: { prodottoId: prodotto.id_prodotto } });
  }

  vaiANovita(articolo: string) {
    this.router.navigate(['/novita', articolo]);
  }

  vaiADettaglioPacchetto(pacchetto: Pacchetto) {
    // Recupera i prodotti del pacchetto e li aggiunge al carrello
    this.pacchettiService.getPacchettoDettaglio(pacchetto.id_pacchetto).subscribe({
      next: (dettaglio) => {
        if (dettaglio && dettaglio.prodotti && dettaglio.prodotti.length > 0) {
          let aggiunti = 0;
          dettaglio.prodotti.forEach(prodotto => {
            this.carrelloService.aggiungiAlCarrello(prodotto.id_prodotto, prodotto.quantita).subscribe({ // Aggiunge ogni prodotto al carrello (chiama funzione in carrkello.service.ts)
              next: () => {
                aggiunti++;
                if (aggiunti === dettaglio.prodotti.length) {
                  alert('Tutti i prodotti del pacchetto sono stati aggiunti al carrello!');
                }
              },
              error: (err) => {
                console.error('Errore aggiunta prodotto al carrello:', err);
              }
            });
          });
        } else {
          alert('Nessun prodotto trovato nel pacchetto.');
        }
      },
      error: (err) => {
        console.error('Errore nel recupero dettagli pacchetto:', err);
        alert('Errore nel recupero dei prodotti del pacchetto.');
      }
    });
  }
  
  ngOnInit() {
    if (this.user) {
      this.showWelcome = true;
      setTimeout(() => {
        this.showWelcome = false;
      }, 3000); // 3 secondi
    }

    // Carica i prodotti più visualizzati dal database
    this.loadProdottiPopular();
    
    // Carica i pacchetti tematici dal database
    this.loadPacchetti();
  }

  loadProdottiPopular() {
    this.loading = true;
    this.catalogoService.getProdottiPopular(6).subscribe({
      next: (prodotti) => {
        this.prodottiInEvidenza = prodotti;
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento prodotti:', err);
        this.error = 'Errore nel caricamento dei prodotti';
        this.loading = false;
        // Fallback ai dati fittizi in caso di errore
        this.prodottiInEvidenza = [
          {
            nome: 'periferiche',
            immagine_url: '/assets/periferiche.png',
            categoria: 'Hardware'
          },
          {
            nome: 'case',
            immagine_url: '/assets/case.png',
            categoria: 'Hardware'
          },
          {
            nome: 'componenti PC',
            immagine_url: '/assets/pc.png',
            categoria: 'Hardware'
          }
        ];
      }
    });
  }

  loadPacchetti() {
    this.loadingPacchetti = true;
    this.pacchettiService.getPacchetti().subscribe({
      next: (pacchetti) => {
        this.pacchetti = pacchetti;
        this.loadingPacchetti = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento pacchetti:', err);
        this.errorPacchetti = 'Errore nel caricamento delle offerte speciali';
        this.loadingPacchetti = false;
        this.pacchetti = [];
      }
    });
  }

  logout() {
    this.auth.logout();
    window.location.reload(); 
  }
}

