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
  // Logica del componente (se necessaria)
  prodotti: any[] = [];

  constructor(private http: HttpClient) {
    this.http.get<any[]>('http://localhost:3000/api/prodotti').subscribe(
      dati => this.prodotti = dati,
      err => console.error('Errore caricamento prodotti:', err)
    );
  }
}
