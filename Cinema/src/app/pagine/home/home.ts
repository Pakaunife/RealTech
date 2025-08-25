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
      img: '/demonslayer.jpg',
      info: '2D'
    },
    {
      titolo: 'Troppo Cattivi 2',
      img: '/troppocattivi2.jpg',
      info: '3D'
    },
    {
      titolo: 'Dangerous Animals',
      img: '/dangerousanimals.jpg',
      info: '2D'
    }
  ];
}
