import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgIf, CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-registrazione',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, RouterModule, NgIf ],
  templateUrl: './registrazione.html',
  styleUrls: ['./registrazione.css']
})
export class Registrazione {

  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
     this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      sesso: ['', Validators.required],
      dataNascita: ['', [Validators.required, this.minAgeValidator(18)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

   minAgeValidator(minAge: number) {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      const today = new Date();
      const birthDate = new Date(control.value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= minAge ? null : { minAge: true };
    };
  }

  onSubmit() {
    if (this.registerForm.valid) {
    this.http.post('http://localhost:3000/api/auth/register', this.registerForm.value)
      .subscribe({
        next: res => {
          alert('Registrazione avvenuta con successo!');
          this.registerForm.reset(); // Svuota il form
          this.router.navigate(['/login']); // Vai al login
        },
        error: err => alert('Errore nella registrazione: ' + err.error.message)
      });
  }

}
}
