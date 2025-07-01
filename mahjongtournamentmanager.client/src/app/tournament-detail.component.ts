import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-tournament-detail',
  templateUrl: './tournament-detail.component.html',
  styleUrls: ['./tournament-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
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
    private router: Router,
    private cdr: ChangeDetectorRef
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
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
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
