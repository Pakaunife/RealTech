import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-minimal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-minimal.html',
  styleUrls: ['./header-minimal.css']
})
export class HeaderMinimal {

}
