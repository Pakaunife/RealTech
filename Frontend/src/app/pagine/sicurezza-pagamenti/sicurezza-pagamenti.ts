import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Footer } from '../../footer/footer';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-sicurezza-pagamenti',
  imports: [CommonModule, Header, Footer],
  templateUrl: './sicurezza-pagamenti.html',
  styleUrl: './sicurezza-pagamenti.css'
})
export class SicurezzaPagamenti {

}
