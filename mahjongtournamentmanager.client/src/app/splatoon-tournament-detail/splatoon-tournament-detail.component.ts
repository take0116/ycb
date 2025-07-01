import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-splatoon-tournament-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splatoon-tournament-detail.component.html',
  styleUrls: ['./splatoon-tournament-detail.component.css']
})
export class SplatoonTournamentDetailComponent implements OnInit {
  tournament: any;
  isParticipating: boolean = false;
  participants: any[] = [];
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.getTournamentDetail(+id);
      }
    });
  }

  getTournamentDetail(id: number): void {
    this.http.get<any>(`/api/SplatoonTournaments/${id}`).subscribe({
      next: (data) => {
        this.tournament = data;
        this.checkParticipation(id);
      },
      error: (error) => {
        console.error('Error fetching Splatoon tournament details', error);
        this.message = '大会詳細の取��に失敗しました。';
      }
    });
  }

  checkParticipation(tournamentId: number): void {
    if (this.authService.currentUserValue) {
      const headers = new HttpHeaders({
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });
      this.http.get<boolean>(`/api/SplatoonTournaments/${tournamentId}/is-participating`, { headers }).subscribe({
        next: (isParticipating) => {
          this.isParticipating = isParticipating;
          if (isParticipating) {
            this.getParticipants(tournamentId);
          } else {
            // 参加していない場合は参加者リストをクリア
            this.participants = [];
          }
        },
        error: (error) => console.error('Error checking participation', error)
      });
    }
  }

  getParticipants(tournamentId: number): void {
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    this.http.get<any>(`/api/SplatoonTournaments/${tournamentId}/participants`, { headers }).subscribe({
      next: (data) => {
        console.log('getParticipants: received data =', data);
        this.participants = data.participants;
        console.log('getParticipants: participants array =', this.participants);
      },
      error: (error) => console.error('Error fetching participants', error)
    });
  }

  joinTournament(): void {
    if (!this.authService.currentUserValue) {
      this.message = 'ログインしてください。';
      return;
    }
    this.http.post(`/api/SplatoonTournaments/${this.tournament.id}/join`, {}, { responseType: 'text' }).subscribe({
      next: () => {
        this.isParticipating = true;
        this.getParticipants(this.tournament.id);
      },
      error: (error) => this.message = error.error?.message || '参加登録に失敗しました。'
    });
  }

  deleteTournament(): void {
    if (confirm('本当にこの大会を削除しますか？')) {
      this.http.delete(`/api/SplatoonTournaments/${this.tournament.id}`).subscribe({
        next: () => {
          this.message = '大会を削除しました。';
          this.router.navigate(['/events']);
        },
        error: (error) => this.message = error.error?.message || '大会の削除に失敗しました。'
      });
    }
  }

  editTournament(): void {
    this.router.navigate(['/splatoon-event-edit', this.tournament.id]);
  }

  removeParticipant(participantUserId: string): void {
    if (confirm('本当にこの参加a者を取り消しますか？')) {
      this.http.delete(`/api/SplatoonTournaments/${this.tournament.id}/participants/${participantUserId}`).subscribe({
        next: () => {
          this.message = '参加者を取り消しました。';
          // もし取り消したのが自分自身であれば、isParticipatingをfalseにする
          if (participantUserId === this.authService.getUserId()) {
            this.isParticipating = false;
          }
          this.checkParticipation(this.tournament.id);
        },
        error: (error) => this.message = error.error?.message || '参加者の取り消しに失敗し��した。'
      });
    }
  }
}
