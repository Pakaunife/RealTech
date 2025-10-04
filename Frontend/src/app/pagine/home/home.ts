import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Footer } from '../../footer/footer';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [Header, Footer, CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

    user: any;
    showWelcome = false;
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
  constructor(public auth: AuthService) {
    this.user = this.auth.getUser();
  }
  
  ngOnInit() {
    if (this.user) {
      this.showWelcome = true;
      setTimeout(() => {
        this.showWelcome = false;
      }, 3000); // 3 secondi
    }
  }

  logout() {
    this.auth.logout();
    window.location.reload(); 
  }
}

