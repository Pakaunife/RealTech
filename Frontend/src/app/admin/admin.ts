import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HeaderMinimal } from '../header-minimal/header-minimal';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, HeaderMinimal],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  users: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    
    this.http.get<any[]>('http://localhost:3000/api/admin/users').subscribe({
    next: users => {
      console.log('Utenti ricevuti:', users); // <-- DEBUG
      this.users = users;
    },
    error: err => {
      console.error('Errore caricamento utenti:', err); // <-- DEBUG
    }
  });
  }

  toggleBlock(user: any) {
    if (!window.confirm(`Sei sicuro di voler ${user.is_blocked ? 'sbloccare' : 'bloccare'} l'utente ${user.nome} ${user.cognome}?`)) {
    return;
  }
    this.http.patch(`http://localhost:3000/api/admin/users/${user.id}/block`, {}).subscribe(() => this.loadUsers());
  }

  toggleAdmin(user: any) {
    if (!window.confirm(`Sei sicuro di voler ${user.is_admin ? 'rimuovere i privilegi admin a' : 'rendere admin'} ${user.nome} ${user.cognome}?`)) {
    return;
  }
    this.http.patch(`http://localhost:3000/api/admin/users/${user.id}/admin`, { makeAdmin: !user.is_admin }).subscribe(() => this.loadUsers());
  }
}
