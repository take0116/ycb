import { Routes } from '@angular/router';
import { TournamentDetailComponent } from './pages/tournament-detail/tournament-detail.component';
import { RegisterComponent } from './pages/register/register.component';
import { TournamentEntryComponent } from './pages/tournament-entry/tournament-entry.component';
import { TournamentCreationComponent } from './pages/tournament-creation/tournament-creation.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { TournamentListComponent } from './pages/tournament-list/tournament-list.component';
import { AuthenticatedLayoutComponent } from './components/authenticated-layout/authenticated-layout.component';
import { TournamentEditComponent } from './pages/tournament-edit/tournament-edit.component';
import { SplatoonTournamentDetailComponent } from './pages/splatoon-tournament-detail/splatoon-tournament-detail.component';
import { MarioKartTournamentDetailComponent } from './pages/mariokart-tournament-detail/mariokart-tournament-detail.component';
import { MarioKartTournamentEditComponent } from './pages/mariokart-tournament-edit/mariokart-tournament-edit.component';
import { SplatoonTournamentEditComponent } from './pages/splatoon-tournament-edit/splatoon-tournament-edit.component';
import { TournamentParticipantsOnlyComponent } from './pages/tournament-participants-only/tournament-participants-only.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '', // This is a dummy path, it will be matched by its children
    component: AuthenticatedLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'events', component: TournamentListComponent },
      { path: 'events/雀魂/:id', component: TournamentDetailComponent },
      { path: 'events/スプラトゥーン/:id', component: SplatoonTournamentDetailComponent },
      { path: 'events/マリオカート/:id', component: MarioKartTournamentDetailComponent },
      { path: 'event-entry/:id', component: TournamentEntryComponent },
      { path: 'create-event', component: TournamentCreationComponent, data: { roles: ['Admin'] } },
      { path: 'event-edit/:id', component: TournamentEditComponent, data: { roles: ['Admin'] } },
      
      // Splatoon Routes
      { path: 'splatoon-event/create', component: SplatoonTournamentEditComponent, data: { roles: ['Admin'] } },
      { path: 'splatoon-event-edit/:id', component: SplatoonTournamentEditComponent, data: { roles: ['Admin'] } },

      // Mario Kart Routes
      { path: 'mariokart-event-edit/:id', component: MarioKartTournamentEditComponent, data: { roles: ['Admin'] } },

      { path: 'tournament-participants-only/:id', component: TournamentParticipantsOnlyComponent, canActivate: [AuthGuard] },
      { path: 'event-list', component: TournamentListComponent }
    ]
  }
];
