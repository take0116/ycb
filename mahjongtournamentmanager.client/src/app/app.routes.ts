import { Routes } from '@angular/router';
import { TournamentDetailComponent } from './tournament-detail.component';
import { RegisterComponent } from './register/register.component';
import { TournamentEntryComponent } from './tournament-entry/tournament-entry.component';
import { TournamentCreationComponent } from './tournament-creation/tournament-creation.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './auth.guard';
import { TournamentListComponent } from './tournament-list/tournament-list.component';
import { AuthenticatedLayoutComponent } from './authenticated-layout/authenticated-layout.component';
import { TournamentEditComponent } from './tournament-edit/tournament-edit.component';
import { SplatoonTournamentEditComponent } from './app/splatoon-tournament-edit/splatoon-tournament-edit.component';
import { SplatoonTournamentDetailComponent } from './app/splatoon-tournament-detail/splatoon-tournament-detail.component';
import { TournamentParticipantsOnlyComponent } from './tournament-participants-only/tournament-participants-only.component';

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
      { path: 'events/:id', component: TournamentDetailComponent },
      { path: 'event-entry/:id', component: TournamentEntryComponent },
      { path: 'create-event', component: TournamentCreationComponent, data: { roles: ['Admin'] } },
      { path: 'event-edit/:id', component: TournamentEditComponent, data: { roles: ['Admin'] } },
      { path: 'splatoon-event/:id', component: SplatoonTournamentDetailComponent },
      { path: 'splatoon-event-edit/:id', component: SplatoonTournamentEditComponent, data: { roles: ['Admin'] } },
      { path: 'tournament-participants-only/:id', component: TournamentParticipantsOnlyComponent, canActivate: [AuthGuard] },
      { path: 'event-list', component: TournamentListComponent }
    ]
  }
];