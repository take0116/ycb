import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-splatoon-tournament-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './splatoon-tournament-detail.component.html',
  styleUrls: ['./splatoon-tournament-detail.component.css']
})
export class SplatoonTournamentDetailComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/api/SplatoonTournaments`;
  tournament: any;
  isLoading = true;
  errorMessage = '';
  isParticipant = false;
  participants: any[] = [];
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get<any>(`${this.apiUrl}/${id}`).subscribe({
        next: data => {
          this.tournament = data;
          this.isLoading = false;
          if (this.authService.currentUserValue) {
            this.checkParticipation();
            this.getParticipants();
          }
        },
        error: err => {
          console.error(err);
          this.errorMessage = '大会の読み込みに失敗しました。';
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = '大会IDが見つかりません。';
      this.isLoading = false;
    }
  }

  checkParticipation(): void {
    this.http.get<boolean>(`${this.apiUrl}/${this.tournament.id}/is-participating`).subscribe({
      next: data => this.isParticipant = data,
      error: err => console.error(err)
    });
  }

  getParticipants(): void {
    this.http.get<any>(`${this.apiUrl}/${this.tournament.id}/participants`).subscribe({
      next: data => this.participants = data.participants,
      error: err => console.error(err)
    });
  }

  joinTournament(): void {
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

  editTournament(): void {
    this.router.navigate(['/splatoon-event-edit', this.tournament.id]);
  }

  removeParticipant(participantUserId: string): void {
    if (confirm('本当にこの参加者を削除しますか？')) {
      this.http.delete(`${this.apiUrl}/${this.tournament.id}/participants/${participantUserId}`).subscribe({
        next: () => this.getParticipants(),
        error: err => console.error(err)
      });
    }
  }

  share(): void {
    const shareText = `${this.tournament.tournamentName}\n${window.location.href}`;
    const shareData = {
      title: this.tournament.tournamentName,
      text: shareText,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Successfully shared'))
        .catch((error) => console.error('Error sharing', error));
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => alert('大会情報をクリップボードにコピーしました。'))
        .catch(err => console.error('Could not copy text: ', err));
    }
  }
}
