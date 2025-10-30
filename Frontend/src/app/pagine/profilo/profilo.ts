import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profilo.html',
  styleUrls: ['./profilo.css']
})
export class Profilo implements OnInit {
  @ViewChild('contenutoSezione') contenutoSezione!: ElementRef;
  sezioneAttiva: string = 'profilo';
  mostraFormIndirizzo: boolean = false; 
  modalitaModifica: boolean = false; 
  indirizzoInModifica: any = null; 
  modalitaModificaProfilo: boolean = false;
  datiProfiloOriginali: any = {};
  
  // Sicurezza
  mostraFormEmail: boolean = false;
  mostraFormPassword: boolean = false;
  
  emailData = {
    nuova_email: '',
    conferma_email: '',
    password: ''
  };
  
  // Dati utente
  utente: any = {
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    data_nascita: '',
    sesso: ''
  };

  // Password
  passwordData = {
    vecchia_password: '',
    nuova_password: '',
    conferma_password: ''
  };

  // Indirizzi
  indirizzi: any[] = [];
  nuovoIndirizzo = {
    destinatario: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    paese: 'Italia',
    predefinito: false,
    telefono: ''
  };

  // Wishlist
  wishlist: any[] = [];

  loading = false;
  messaggio: string = '';
  errore: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.caricaDatiUtente();
  }

  cambiaSezione(sezione: string): void {
    this.sezioneAttiva = sezione;
    this.messaggio = '';
    this.errore = '';
    this.mostraFormIndirizzo = false;
    this.modalitaModifica = false;
    this.indirizzoInModifica = null;
    this.modalitaModificaProfilo = false;
    this.mostraFormEmail = false;
    this.mostraFormPassword = false;

    if (sezione === 'indirizzi') {
      this.caricaIndirizzi();
    } else if (sezione === 'wishlist') {
      this.caricaWishlist();
    }

    // Scroll più morbido con offset
    setTimeout(() => {
      const element = this.contenutoSezione?.nativeElement;
      if (element) {
        const offset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 150);
  }

  // ========================================
  // GESTIONE PROFILO (DATI PERSONALI)
  // ========================================

  caricaDatiUtente(): void {
    this.loading = true;
    this.messaggio = '';
    this.errore = '';
    this.userService.getUserProfile().subscribe({
      next: (data) => {
        this.utente = data;
        this.datiProfiloOriginali = { ...data }; // Salva copia originale
        this.loading = false;
      },
      error: (err: any) => {
        this.errore = 'Errore nel caricamento dei dati';
        this.loading = false;
        console.error(err);
      }
    });
  }

  abilitaModificaProfilo(): void {
    this.modalitaModificaProfilo = true;
    this.messaggio = '';
    this.errore = '';
  }

  annullaModificaProfilo(): void {
    this.utente = { ...this.datiProfiloOriginali }; // Ripristina dati originali
    this.modalitaModificaProfilo = false;
    this.messaggio = '';
    this.errore = '';
  }

  aggiornaProfilo(): void {
    this.loading = true;
    this.messaggio = '';
    this.errore = '';
    
    // Invia solo nome, cognome, telefono e data_nascita (non email)
    const datiDaAggiornare = {
      nome: this.utente.nome,
      cognome: this.utente.cognome,
      telefono: this.utente.telefono,
      data_nascita: this.utente.data_nascita,
      sesso: this.utente.sesso,
      email: this.utente.email // Include comunque l'email ma non la cambia
    };
    
    this.userService.updateProfile(datiDaAggiornare).subscribe({
      next: (response) => {
        this.messaggio = 'Profilo aggiornato con successo';
        this.datiProfiloOriginali = { ...response }; // Aggiorna i dati originali
        this.utente = { ...response };
        this.modalitaModificaProfilo = false;
        setTimeout(() => {
          this.messaggio = '';
        }, 3000);
        this.loading = false;
      },
      error: (err: any) => {
        this.errore = err.error?.message || 'Errore nell\'aggiornamento del profilo';
        setTimeout(() => {
          this.errore = '';
        }, 5000);
        this.loading = false;
        console.error(err);
      }
    });
  }

  // ========================================
  // GESTIONE SICUREZZA (EMAIL E PASSWORD)
  // ========================================

  abilitaModificaEmail(): void {
    this.mostraFormEmail = true;
    this.mostraFormPassword = false;
    this.messaggio = '';
    this.errore = '';
  }

  annullaModificaEmail(): void {
    this.mostraFormEmail = false;
    this.emailData = { nuova_email: '', conferma_email: '', password: '' };
    this.messaggio = '';
    this.errore = '';
  }

  cambiaEmail(): void {
    if (this.emailData.nuova_email !== this.emailData.conferma_email) {
      this.errore = 'Le email non coincidono';
      setTimeout(() => {
        this.errore = '';
      }, 3000);
      return;
    }

    if (!this.emailData.password) {
      this.errore = 'Inserisci la password per confermare';
      setTimeout(() => {
        this.errore = '';
      }, 3000);
      return;
    }

    this.loading = true;
    this.messaggio = '';
    this.errore = '';
    this.userService.changeEmail(this.emailData).subscribe({
      next: (response) => {
        this.messaggio = 'Email cambiata con successo';
        this.utente.email = this.emailData.nuova_email;
        this.datiProfiloOriginali.email = this.emailData.nuova_email;
        this.mostraFormEmail = false;
        this.emailData = { nuova_email: '', conferma_email: '', password: '' };
        setTimeout(() => {
          this.messaggio = '';
        }, 3000);
        this.loading = false;
      },
      error: (err: any) => {
        this.errore = err.error?.message || 'Errore nel cambio email';
        setTimeout(() => {
          this.errore = '';
        }, 5000);
        this.loading = false;
      }
    });
  }

  abilitaModificaPassword(): void {
    this.mostraFormPassword = true;
    this.mostraFormEmail = false;
    this.messaggio = '';
    this.errore = '';
  }

  annullaModificaPassword(): void {
    this.mostraFormPassword = false;
    this.passwordData = { vecchia_password: '', nuova_password: '', conferma_password: '' };
    this.messaggio = '';
    this.errore = '';
  }

  cambiaPassword(): void {
    if (this.passwordData.nuova_password !== this.passwordData.conferma_password) {
      this.errore = 'Le password non coincidono';
      setTimeout(() => {
        this.errore = '';
      }, 3000);
      return;
    }

    if (this.passwordData.nuova_password.length < 6) {
      this.errore = 'La password deve contenere almeno 6 caratteri';
      setTimeout(() => {
        this.errore = '';
      }, 3000);
      return;
    }

    this.loading = true;
    this.messaggio = '';
    this.errore = '';
    this.userService.changePassword(this.passwordData).subscribe({
      next: (response) => {
        this.messaggio = 'Password cambiata con successo';
        this.mostraFormPassword = false;
        this.passwordData = { vecchia_password: '', nuova_password: '', conferma_password: '' };
        setTimeout(() => {
          this.messaggio = '';
        }, 3000);
        this.loading = false;
      },
      error: (err: any) => {
        this.errore = err.error?.message || 'Errore nel cambio password';
        setTimeout(() => {
          this.errore = '';
        }, 5000);
        this.loading = false;
      }
    });
  }

  // ========================================
  // GESTIONE INDIRIZZI
  // ========================================

  toggleFormIndirizzo(): void {
    this.mostraFormIndirizzo = !this.mostraFormIndirizzo;
    this.messaggio = '';
    this.errore = '';
    if (!this.mostraFormIndirizzo) {
      this.modalitaModifica = false;
      this.indirizzoInModifica = null;
      this.resetFormIndirizzo();
    }
  }

  resetFormIndirizzo(): void {
    this.nuovoIndirizzo = { 
      destinatario: '',
      indirizzo: '', 
      citta: '', 
      cap: '', 
      provincia: '', 
      paese: 'Italia',
      predefinito: false,
      telefono: ''
    };
  }

  modificaIndirizzo(indirizzo: any): void {
    this.modalitaModifica = true;
    this.indirizzoInModifica = indirizzo;
    this.nuovoIndirizzo = {
      destinatario: indirizzo.destinatario,
      indirizzo: indirizzo.indirizzo,
      citta: indirizzo.citta,
      cap: indirizzo.cap,
      provincia: indirizzo.provincia,
      paese: indirizzo.paese,
      predefinito: indirizzo.predefinito,
      telefono: indirizzo.telefono || ''
    };
    this.mostraFormIndirizzo = true;
    this.messaggio = '';
    this.errore = '';
  }

  caricaIndirizzi(): void {
    this.loading = true;
    this.messaggio = '';
    this.errore = '';
    this.userService.getAddresses().subscribe({
      next: (data) => {
        this.indirizzi = data.sort((a: any, b: any) => {
          if (a.predefinito && !b.predefinito) return -1;
          if (!a.predefinito && b.predefinito) return 1;
          return b.id - a.id;
        });
        this.loading = false;
      },
      error: (err: any) => {
        this.errore = 'Errore nel caricamento degli indirizzi';
        this.loading = false;
        console.error(err);
      }
    });
  }

  aggiungiIndirizzo(): void {
    if (this.modalitaModifica && this.indirizzoInModifica) {
      this.salvaModificaIndirizzo();
    } else {
      this.salvaIndirizzo();
    }
  }

  salvaIndirizzo(): void {
    this.loading = true;
    this.messaggio = '';
    this.errore = '';
    this.userService.addAddress(this.nuovoIndirizzo).subscribe({
      next: (response) => {
        this.messaggio = 'Indirizzo aggiunto con successo';
        setTimeout(() => {
          this.messaggio = '';
        }, 3000);
        this.caricaIndirizzi();
        this.resetFormIndirizzo();
        this.mostraFormIndirizzo = false;
        this.loading = false;
      },
      error: (err: any) => {
        this.errore = err.error?.message || 'Errore nell\'aggiunta dell\'indirizzo';
        setTimeout(() => {
          this.errore = '';
        }, 5000);
        this.loading = false;
      }
    });
  }

  salvaModificaIndirizzo(): void {
    this.loading = true;
    this.messaggio = '';
    this.errore = '';
    this.userService.updateAddress(this.indirizzoInModifica.id, this.nuovoIndirizzo).subscribe({
      next: (response) => {
        this.messaggio = 'Indirizzo modificato con successo';
        setTimeout(() => {
          this.messaggio = '';
        }, 3000);
        this.caricaIndirizzi();
        this.resetFormIndirizzo();
        this.mostraFormIndirizzo = false;
        this.modalitaModifica = false;
        this.indirizzoInModifica = null;
        this.loading = false;
      },
      error: (err: any) => {
        this.errore = err.error?.message || 'Errore nella modifica dell\'indirizzo';
        setTimeout(() => {
          this.errore = '';
        }, 5000);
        this.loading = false;
      }
    });
  }

  eliminaIndirizzo(id: number): void {
    if (confirm('Sei sicuro di voler eliminare questo indirizzo?')) {
      this.messaggio = '';
      this.errore = '';
      this.userService.deleteAddress(id).subscribe({
        next: () => {
          this.messaggio = 'Indirizzo eliminato';
          setTimeout(() => {
            this.messaggio = '';
          }, 3000);
          this.caricaIndirizzi();
        },
        error: (err: any) => {
          this.errore = 'Errore nell\'eliminazione';
          setTimeout(() => {
            this.errore = '';
          }, 5000);
          console.error(err);
        }
      });
    }
  }

  impostaPredefinito(id: number): void {
    this.messaggio = '';
    this.errore = '';
    this.loading = true;
    this.userService.setDefaultAddress(id).subscribe({
      next: () => {
        this.messaggio = 'Indirizzo impostato come predefinito';
        setTimeout(() => {
          this.messaggio = '';
        }, 3000);
        this.userService.getAddresses().subscribe({
          next: (data) => {
            this.indirizzi = data.sort((a: any, b: any) => {
              if (a.predefinito && !b.predefinito) return -1;
              if (!a.predefinito && b.predefinito) return 1;
              return b.id - a.id;
            });
            this.loading = false;
          },
          error: (err: any) => {
            console.error('Errore nel ricaricamento:', err);
            this.loading = false;
          }
        });
      },
      error: (err: any) => {
        this.errore = 'Errore nell\'impostazione';
        this.loading = false;
        setTimeout(() => {
          this.errore = '';
        }, 5000);
        console.error(err);
      }
    });
  }

  // ========================================
  // GESTIONE WISHLIST
  // ========================================

  caricaWishlist(): void {
    this.loading = true;
    this.userService.getWishlist().subscribe({
      next: (data) => {
        this.wishlist = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.errore = 'Errore nel caricamento della wishlist';
        this.loading = false;
        console.error(err);
      }
    });
  }

  rimuoviDaWishlist(prodottoId: number): void {
    this.userService.removeFromWishlist(prodottoId).subscribe({
      next: () => {
        this.messaggio = 'Prodotto rimosso dalla wishlist';
        this.caricaWishlist();
      },
      error: (err: any) => {
        this.errore = 'Errore nella rimozione';
        console.error(err);
      }
    });
  }

  vaiAgliOrdini() {
    this.router.navigate(['/ordini']);
  }
  vaiAllaWishlist() {
    this.router.navigate(['/wishlist']);
  }
}