import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-minimal',
  imports: [CommonModule, RouterModule],
  templateUrl: './header-minimal.html',
  styleUrl: './header-minimal.css'
})
export class HeaderMinimal {

}
