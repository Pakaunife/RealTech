import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcquistiService } from '../../services/acquisti.service';

@Component({
  selector: 'app-storico-acquisti',
  imports: [CommonModule],
  templateUrl: './storico-acquisti.html',
  styleUrl: './storico-acquisti.css'
})
export class StoricoAcquisti implements OnInit {
  acquisti: any[] = [];
  loading = true;
  errore: string | null = null;

  constructor(private acquistiService: AcquistiService) {}

  ngOnInit(): void {
    this.acquistiService.getStoricoAcquisti().subscribe({
      next: (data) => {
        this.acquisti = data;
        this.loading = false;
      },
      error: (err) => {
        this.errore = err.error?.error || 'Errore nel caricamento dello storico';
        this.loading = false;
      }
    });
  }
}
