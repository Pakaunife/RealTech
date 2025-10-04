import { Component, OnInit } from '@angular/core';
import { Header} from '../../header/header';
import { Footer } from '../../footer/footer';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Component({
  selector: 'app-profilo',
  imports: [Header, Footer],
  templateUrl: './profilo.html',
  styleUrl: './profilo.css'
})
export class Profilo {
  user : any;
  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    this.http.get('http://localhost:3000/api/profile/me', {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    }).subscribe({
      next: data => this.user = data,
      error: err => alert('Errore nel recupero dati profilo')
    });
  }

}
