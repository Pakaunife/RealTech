import { Component } from '@angular/core';
import { HeaderMinimal} from '../../header-minimal/header-minimal';
import { Footer } from '../../footer/footer';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CarrelloService } from '../../services/carrello.service';

@Component({
  selector: 'app-login',
  imports: [HeaderMinimal, Footer, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  
 // Dopo il login, ricarica il carrello con i dati dell'utente loggato
  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private router: Router,
    private carrelloService: CarrelloService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.http.post<any>('http://localhost:3000/api/auth/login', this.loginForm.value)
        .subscribe({
          next: (res: any) => {
           localStorage.setItem('token', res.token);
            
            // Ricarica il carrello con i dati dell'utente loggato
            this.carrelloService.ricaricaCarrello();
            
            this.router.navigate(['/home']);
          },
          error: err => alert('Errore nel login: ' + (err.error?.message || ''))
        });
    }
  }
}