import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-film',
  templateUrl: './film.html',
  styleUrls: ['./film.css'],
  standalone: true,
  imports: [CommonModule]   
})
export class Film {
  film: any[] = [];

  constructor(private http: HttpClient) {
    this.http.get<any[]>('http://localhost:3000/api/film').subscribe(
      dati => this.film = dati,
      err => console.error('Errore caricamento film:', err)
    );
  }
}





