import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from './auth.service';
import { Tournament } from './tournament';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule],
  templateUrl: './tournament-detail.component.html',
  styleUrls: ['./tournament-detail.component.scss']
})
export class TournamentDetailComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/api/TournamentSettings`;
  tournament: any;
  isLoggedIn: boolean = false;
  isParticipant: boolean = false;
  participants: any[] = [];
  isAdmin: boolean = false;
  userId: string | null = null;
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.currentUserValue !== null;
    this.isAdmin = this.authService.hasRole('Admin');
    this.userId = this.authService.getUserId();
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
      next: data => {
        this.tournament = data;
        if (this.isLoggedIn) {
          this.checkParticipation();
        }
        this.getParticipants();
      },
      error: err => {
        console.error(err);
        this.message = '大会の読み込みに失敗しました。';
      }
    });
  }

  checkParticipation(): void {
    const tournamentId = this.route.snapshot.paramMap.get('id');
    this.http.get<boolean>(`${this.apiUrl}/${tournamentId}/is-participating`).subscribe({
      next: data => {
        this.isParticipant = data;
      },
      error: err => console.error(err)
    });
  }

  getParticipants(): void {
    const tournamentId = this.route.snapshot.paramMap.get('id');
    this.http.get<any>(`${this.apiUrl}/${tournamentId}/participants`).subscribe({
      next: data => {
        this.participants = data.participants;
      },
      error: err => console.error(err)
    });
  }

  joinTournament(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.http.post(`${this.apiUrl}/${this.tournament.id}/join`, {}, { responseType: 'text' }).subscribe({
      next: () => {
        this.isParticipant = true;
        this.getParticipants();
      },
      error: err => console.error(err)
    });
  }

  deleteTournament(): void {
    if (confirm('本当にこの大会を削除しますか？')) {
      this.http.delete(`${this.apiUrl}/${this.tournament.id}`).subscribe({
        next: () => this.router.navigate(['/events']),
        error: err => console.error(err)
      });
    }
  }

  removeParticipant(participantUserId: string): void {
    if (confirm('本当にこの参加者を削除しますか？')) {
      this.http.delete(`${this.apiUrl}/${this.tournament.id}/participants/${participantUserId}`).subscribe({
        next: () => {
          this.getParticipants();
        },
        error: err => console.error(err)
      });
    }
  }

  editTournament(): void {
    this.router.navigate(['/event-edit', this.tournament.id]);
  }

  viewParticipantsOnly(): void {
    this.router.navigate(['/tournament-participants-only', this.tournament.id]);
  }
}
