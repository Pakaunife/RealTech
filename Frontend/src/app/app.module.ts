import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { App } from './app';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { TokenInterceptor } from './services/token.interceptor';
import { routes } from './app.routes'; // Se hai le route definite

@NgModule({
  declarations: [
    // Qui metti i tuoi componenti se non sono standalone
  ],
  imports: [
    BrowserModule,
    HttpClientModule, // <-- Aggiungi questo
    RouterModule.forRoot(routes), // <-- Aggiungi questo se hai le route
    Header,
    Footer,
    App
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule {}