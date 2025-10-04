import { Component } from '@angular/core';
import { HeaderMinimal} from '../../header-minimal/header-minimal';
import { Footer } from '../../footer/footer';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [HeaderMinimal, Footer, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
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
            
            this.router.navigate(['/home']);
          },
          error: err => alert('Errore nel login: ' + (err.error?.message || ''))
        });
    }
  }
}