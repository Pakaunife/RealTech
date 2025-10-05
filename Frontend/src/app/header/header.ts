import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  user: any;
  constructor(public auth: AuthService) {
    this.user = this.auth.getUser();
  }
  ngOnInit() {
    this.auth.user$.subscribe(user => this.user = user);
  }
   logout() {
    this.auth.logout();
  }
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
