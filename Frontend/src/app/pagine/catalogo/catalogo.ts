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
  
  // Gestione stati
  mostraCategorie: boolean = true;
  mostraProdotti: boolean = false;
  mostraDettaglio: boolean = false;
  categoriaSelezionata: string = '';
  
  constructor(private http: HttpClient) {
    this.caricaCategorie();
  }
  
  caricaCategorie() {
    this.http.get<any[]>('http://localhost:3000/api/catalogo/prodotti').subscribe(
      dati => this.categorie = dati,
      err => console.error('Errore caricamento categorie:', err)
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
    this.http.get<any[]>(`http://localhost:3000/api/catalogo/prodotti/categoria/${categoria}`).subscribe(
      dati => this.prodotti = dati,
      err => console.error('Errore caricamento prodotti:', err)
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
