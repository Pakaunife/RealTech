import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Footer } from '../../footer/footer';
import { CommonModule } from '@angular/common'; 
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-catalogo',
  imports: [CommonModule, Header, Footer],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css']
})
export class Catalogo {
  categorie: any[] = [];
  prodotti: any[] = [];
  prodottoSelezionato: any = null;
  
  // Gestione stati, ariabili booleane per gestire quale sezione mostrare nella pagina.
  mostraCategorie: boolean = true;
  mostraProdotti: boolean = false;
  mostraDettaglio: boolean = false;
  categoriaSelezionata: string = '';
  caricamento: boolean = true;
  constructor(private http: HttpClient) {
    this.caricaCategorie();
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
  }
}
