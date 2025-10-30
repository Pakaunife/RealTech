import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-novita',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './novita.html',
  styleUrls: ['./novita.css']
})
export class Novita implements OnInit {
  articolo: string = '';
  titolo: string = '';
  contenuto: string = '';
  immagine: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.articolo = params['articolo'];
      this.caricaArticolo();
    });
  }

  caricaArticolo() {
    const articoli: any = {
      'notebook-gaming-2025': {
        titolo: 'Miglior notebook per studenti e gamer del 2025',
        immagine: 'assets/news-notebook.jpg',
        contenuto: `
          <h2>Il futuro del gaming portatile</h2>
          <p>ROG ha rivoluzionato il mercato dei notebook gaming con i nuovi modelli 2025. Perfetti per studenti e gamer professionisti.</p>
          <h3>Caratteristiche principali:</h3>
          <ul>
            <li>Processori AMD Ryzen 7000 series</li>
            <li>GPU NVIDIA RTX 4070/4080</li>
            <li>Display 165Hz con tecnologia G-SYNC</li>
            <li>Sistema di raffreddamento avanzato</li>
            <li>Tastiera meccanica RGB personalizzabile</li>
          </ul>
          <p>Ideali per gaming, sviluppo software, rendering e studio. Autonomia fino a 8 ore in uso misto.</p>
        `
      },
      'raffreddamento-smartphone': {
        titolo: 'Sistema di raffreddamento negli smartphone gaming',
        immagine: 'assets/news-cooling.jpg',
        contenuto: `
          <h2>Tecnologia GameCool 7</h2>
          <p>Il nuovo sistema di raffreddamento GameCool 7 mantiene le prestazioni al massimo anche durante sessioni di gioco intensive.</p>
          <h3>Innovazioni tecniche:</h3>
          <ul>
            <li>Camera di vapore 3D di nuova generazione</li>
            <li>Grafite termica ad alta conduttività</li>
            <li>Ventola AeroActive integrata</li>
            <li>Gel termico liquido</li>
          </ul>
          <p>Riduzione della temperatura fino a 25°C rispetto alla generazione precedente.</p>
        `
      },
      'rog-phone-9-pro': {
        titolo: 'AI gaming con ROG Phone 9 Pro',
        immagine: 'assets/AI.jpg',
        contenuto: `
          <h2>L'AI incontra il mobile gaming</h2>
          <p>ROG Phone 9 Pro integra l'intelligenza artificiale per ottimizzare automaticamente le prestazioni di gioco.</p>
          <h3>Funzionalità AI:</h3>
          <ul>
            <li>Game Optimizer AI - ottimizzazione automatica</li>
            <li>Adaptive Performance - gestione intelligente della batteria</li>
            <li>AI Camera per streaming in tempo reale</li>
            <li>Voice Assistant gaming integrato</li>
          </ul>
          <p>Snapdragon 8 Gen 3, fino a 24GB RAM, display AMOLED 165Hz.</p>
        `
      },
      'command-center-z13': {
        titolo: 'Command Center del ROG Flow Z13',
        immagine: 'assets/news-command-center.jpg',
        contenuto: `
          <h2>Centro di controllo gaming avanzato</h2>
          <p>Il Command Center del ROG Flow Z13 offre controllo completo su ogni aspetto del sistema.</p>
          <h3>Funzionalità principali:</h3>
          <ul>
            <li>Profili performance personalizzabili</li>
            <li>Controllo RGB sincronizzato</li>
            <li>Monitor system real-time</li>
            <li>Overclock guidato e sicuro</li>
            <li>Game mode automatico</li>
          </ul>
          <p>Interface intuitiva per massimizzare le prestazioni del tuo 2-in-1 gaming.</p>
        `
      },
      'vetrina-flow-z13': {
        titolo: 'Vetrina prodotti | ROG Flow Z13 2025',
        immagine: 'assets/news-flow-z13.jpg',
        contenuto: `
          <h2>Il tablet gaming più potente al mondo</h2>
          <p>ROG Flow Z13 2025 ridefinisce il concetto di gaming portatile con performance desktop in formato tablet.</p>
          <h3>Specifiche tecniche:</h3>
          <ul>
            <li>Intel Core i9-14900H</li>
            <li>NVIDIA RTX 4070 Mobile</li>
            <li>Display 4K 120Hz touchscreen</li>
            <li>Fino a 32GB RAM LPDDR5</li>
            <li>SSD PCIe 4.0 fino a 2TB</li>
            <li>Compatibilità ROG XG Mobile</li>
          </ul>
          <p>Versatilità assoluta: tablet, laptop, desktop gaming. Tutto in uno.</p>
        `
      }
    };

    const art = articoli[this.articolo];
    if (art) {
      this.titolo = art.titolo;
      this.contenuto = art.contenuto;
      this.immagine = art.immagine;
    }
  }
}