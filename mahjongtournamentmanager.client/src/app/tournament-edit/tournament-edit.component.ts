import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';

interface Tournament {
  id: string;
  gameTitle: string;
  tournamentName: string;
  description: string;
  playerCount: number;
  startDate: string;
  endDate: string;
  gameType: string;
  thinkTime: string;
  allowFlying: boolean;
  redDora: boolean;
  startingScore: number;
  status: number;
}

@Component({
  selector: 'app-tournament-edit',
  templateUrl: './tournament-edit.component.html',
  styleUrls: ['./tournament-edit.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class TournamentEditComponent implements OnInit {
  private mahjongApiUrl = `${environment.apiUrl}/api/TournamentSettings`;
  private splatoonApiUrl = `${environment.apiUrl}/api/SplatoonTournaments`;
  tournamentForm: FormGroup;
  splatoonTournamentForm: FormGroup;
  tournamentId: string | null = null;
  gameTitle: string | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage: string = '';
  startingScoreOptions: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private location: Location
  ) {
    this.tournamentForm = this.fb.group({
      tournamentName: ['', Validators.required],
      description: [''],
      playerCount: [4, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      gameType: ['ヨンマ', Validators.required],
      thinkTime: ['60+0', Validators.required],
      allowFlying: [true],
      redDora: [true],
      startingScore: [25000, Validators.required],
      status: [1, Validators.required]
    });

    this.splatoonTournamentForm = this.fb.group({
      tournamentName: ['', Validators.required],
      eventDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      gameMode: ['プライベートマッチ', Validators.required],
      status: [1, Validators.required],
      comment: ['']
    });
  }

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.paramMap.get('id');
    if (this.tournamentId) {
      // This is a bit of a hack. We don't know the game type from the URL,
      // so we have to fetch from both endpoints and see which one returns data.
      this.http.get<Tournament>(`${this.mahjongApiUrl}/${this.tournamentId}`).subscribe({
        next: tournament => {
          if (tournament) {
            this.gameTitle = '雀魂';
            this.tournamentForm.patchValue(tournament);
            this.onGameTypeSelectionChange(); // Set initial score options
            this.isLoading = false;
          }
        },
        error: () => {
          this.http.get<any>(`${this.splatoonApiUrl}/${this.tournamentId}`).subscribe(tournament => {
            this.gameTitle = 'スプラトゥーン';
            this.splatoonTournamentForm.patchValue(tournament);
            this.isLoading = false;
          });
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  onGameTypeSelectionChange(): void {
    const gameType = this.tournamentForm.get('gameType')?.value;
    const playerCount = gameType === 'サンマ' ? 3 : 4;
    this.tournamentForm.patchValue({ playerCount: playerCount });
    this.startingScoreOptions = gameType === 'サンマ' ? [35000, 40000] : [25000, 30000];
    if (!this.startingScoreOptions.includes(this.tournamentForm.get('startingScore')?.value)) {
      this.tournamentForm.patchValue({ startingScore: this.startingScoreOptions[0] });
    }
  }

  onSubmit(): void {
    if (this.tournamentId) {
      this.isSubmitting = true;
      if (this.gameTitle === '雀魂') {
        if (this.tournamentForm.valid) {
          const tournamentData = { id: +this.tournamentId, ...this.tournamentForm.value };
          this.http.put(`${this.mahjongApiUrl}/${this.tournamentId}`, tournamentData).subscribe({
            next: () => this.router.navigate(['/events', this.tournamentId]),
            error: (err) => {
              console.error(err);
              this.errorMessage = '更新に失敗しました。';
              this.isSubmitting = false;
            }
          });
        }
      } else if (this.gameTitle === 'スプラトゥーン') {
        if (this.splatoonTournamentForm.valid) {
          const tournamentData = { id: +this.tournamentId, ...this.splatoonTournamentForm.value };
          this.http.put(`${this.splatoonApiUrl}/${this.tournamentId}`, tournamentData).subscribe({
            next: () => this.router.navigate(['/splatoon-event', this.tournamentId]),
            error: (err) => {
              console.error(err);
              this.errorMessage = '更新に失敗しました。';
              this.isSubmitting = false;
            }
          });
        }
      }
    }
  }

  goBack(): void {
    this.location.back();
  }
}
