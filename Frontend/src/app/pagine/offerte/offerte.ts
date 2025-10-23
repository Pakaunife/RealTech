import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, NgIf, NgForOf, Location } from '@angular/common';
import { PacchettiService, PacchettoDettaglio } from '../../services/pacchetti.service';
import { CarrelloService } from '../../services/carrello.service';

@Component({
  selector: 'app-offerte',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf],
  templateUrl: './offerte.html',
  styleUrls: ['./offerte.css']
})
export class Offerte implements OnInit {
  pacchettoDettaglio: PacchettoDettaglio | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private pacchettiService: PacchettiService,
    private carrelloService: CarrelloService,
    private location: Location
  ) {}
  aggiungiAlCarrello() {
    if (!this.pacchettoDettaglio) return;
    const idPacchetto = this.pacchettoDettaglio.pacchetto.id_pacchetto;
    this.carrelloService.aggiungiPacchettoAlCarrello(idPacchetto, 1).subscribe({
      next: () => {
        // Puoi mostrare una notifica di successo qui
        alert('Pacchetto aggiunto al carrello!');
      },
      error: (err) => {
        alert('Errore nell\'aggiunta al carrello: ' + err.message);
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (!isNaN(id)) {
        this.loadPacchetto(id);
      } else {
        this.error = 'ID pacchetto non valido';
        this.loading = false;
      }
    });
  }

  loadPacchetto(id: number) {
    this.loading = true;
    this.pacchettiService.getPacchettoDettaglio(id).subscribe({
      next: (res) => {
        this.pacchettoDettaglio = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore caricamento pacchetto:', err);
        this.error = 'Errore nel caricamento del pacchetto';
        this.loading = false;
      }
    });
  }

  // Public method used by the template to navigate back
  public back() {
    this.location.back();
  }
}