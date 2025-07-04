import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tournament-creation',
  templateUrl: './tournament-creation.component.html',
  styleUrls: ['./tournament-creation.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class TournamentCreationComponent implements OnInit {
  private mahjongApiUrl = `${environment.apiUrl}/api/TournamentSettings`;
  private splatoonApiUrl = `${environment.apiUrl}/api/SplatoonTournaments`;
  tournamentForm: FormGroup;
  splatoonTournamentForm: FormGroup;
  isSubmitting = false;
  selectedGameType: string = '雀魂';
  startingScoreOptions: number[] = [25000, 30000, 35000];
  message: string = '';

  constructor(private http: HttpClient, private router: Router, private fb: FormBuilder) {
    this.tournamentForm = this.fb.group({
      tournamentName: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      playerCount: [4, Validators.required],
      gameType: ['ヨンマ', Validators.required],
      thinkTime: ['5+20', Validators.required],
      allowFlying: [true],
      redDora: [true],
      startingScore: [25000, Validators.required],
      status: [1, Validators.required],
      description: ['']
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
    this.onGameTypeSelectionChange();
  }

  onGameTypeSelectionChange(): void {
    const gameType = this.tournamentForm.get('gameType')?.value;
    const playerCount = gameType === 'サンマ' ? 3 : 4;
    this.tournamentForm.patchValue({ playerCount: playerCount });
  }

  createTournament(): void {
    if (this.selectedGameType === '雀魂') {
      if (this.tournamentForm.invalid) {
        this.message = '入力内容に誤りがあります。';
        return;
      }
      this.isSubmitting = true;
      const tournamentData = this.tournamentForm.value;
      this.http.post(this.mahjongApiUrl, tournamentData).subscribe({
        next: () => this.router.navigate(['/events']),
        error: (err) => {
          console.error(err);
          this.isSubmitting = false;
          this.message = '作成に失敗しました。';
        }
      });
    } else if (this.selectedGameType === 'スプラトゥーン') {
      if (this.splatoonTournamentForm.invalid) {
        this.message = '入力内容に誤りがあります。';
        return;
      }
      this.isSubmitting = true;
      const tournamentData = this.splatoonTournamentForm.value;
      this.http.post(this.splatoonApiUrl, tournamentData).subscribe({
        next: () => this.router.navigate(['/events']),
        error: (err) => {
          console.error(err);
          this.isSubmitting = false;
          this.message = '作成に失敗しました。';
        }
      });
    }
  }
}
