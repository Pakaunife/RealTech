import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
 showSignInMenu = false;

  toggleSignInMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showSignInMenu = !this.showSignInMenu;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showSignInMenu = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.showSignInMenu = false;
  }

}
