import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Footer } from '../../footer/footer';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-home',
  imports: [Header, Footer, CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  filmInEvidenza = [
    {
      titolo: 'periferiche',
      img: '/assets/periferiche.png',
      info: '2D'
    },
    {
      titolo: 'case',
      img: '/assets/case.png',
      info: '3D'
    },
    {
      titolo: 'componenti PC',
      img: '/assets/pc.png',
      info: '2D'
    }
    
  ];
}
