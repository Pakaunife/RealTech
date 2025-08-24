import { Component } from '@angular/core';
import { Header } from '../../header/header';
import { Footer } from '../../footer/footer';
@Component({
  selector: 'app-about',
  imports: [Header, Footer],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About {

}
