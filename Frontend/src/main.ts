import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { TokenInterceptor } from './app/services/token.interceptor';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([TokenInterceptor])
    )
  ]
})
.catch((err) => console.error(err));