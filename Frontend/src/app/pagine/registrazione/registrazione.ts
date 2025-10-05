import { Component } from '@angular/core';
import { HeaderMinimal} from '../../header-minimal/header-minimal';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-registrazione',
  imports: [HeaderMinimal, ReactiveFormsModule],
  templateUrl: './registrazione.html',
  styleUrl: './registrazione.css'
})
export class Registrazione {

  registerForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.http.post('http://localhost:3000/api/auth/register', this.registerForm.value)
        .subscribe({
          next: res => alert('Registrazione avvenuta con successo!'),
          error: err => alert('Errore nella registrazione: ' + err.error.message)
        });
    }

}
}
