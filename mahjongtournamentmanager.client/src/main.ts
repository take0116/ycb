import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './app/services/auth.service';
import { TournamentService } from './app/services/tournament.service';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { registerLocaleData } from '@angular/common';
import localeJa from '@angular/common/locales/ja';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeJa);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    TournamentService,
    AuthService,
    { provide: LOCALE_ID, useValue: 'ja-JP' }
  ]
}).catch(err => console.error(err));
