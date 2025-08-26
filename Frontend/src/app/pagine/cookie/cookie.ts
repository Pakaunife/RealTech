import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Footer } from '../../footer/footer';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-cookie',
  imports: [CommonModule, Header, Footer],
  templateUrl: './cookie.html',
  styleUrl: './cookie.css'
})
export class Cookie {

}
