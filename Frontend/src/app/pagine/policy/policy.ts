import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Footer } from '../../footer/footer';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-policy',
  imports: [CommonModule, Header, Footer],
  templateUrl: './policy.html',
  styleUrl: './policy.css'
})
export class Policy {

}
