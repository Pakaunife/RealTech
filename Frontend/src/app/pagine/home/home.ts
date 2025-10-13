import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { CatalogoService } from '../../services/catalogo.service';

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
    loading = true;
    error = '';

  constructor(
    public auth: AuthService,
    private catalogoService: CatalogoService,
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
  
  ngOnInit() {
    if (this.user) {
      this.showWelcome = true;
      setTimeout(() => {
        this.showWelcome = false;
      }, 3000); // 3 secondi
    }

    // Carica i prodotti più visualizzati dal database
    this.loadProdottiPopular();
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

  logout() {
    this.auth.logout();
    window.location.reload(); 
  }
}

