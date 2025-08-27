import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Footer } from '../../footer/footer';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-home',
  imports: [Header, Footer, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  filmInEvidenza = [
    {
      titolo: 'DEMON SLAYER: Kimetsu no Yaiba',
      img: '/assets/demonslayer.jpg',
      info: '2D'
    },
    {
      titolo: 'Troppo Cattivi 2',
      img: '/assets/troppocattivi2.jpg',
      info: '3D'
    },
    {
      titolo: 'Dangerous Animals',
      img: '/assets/dangerousanimals.jpg',
      info: '2D'
    }
    
  ];
}
