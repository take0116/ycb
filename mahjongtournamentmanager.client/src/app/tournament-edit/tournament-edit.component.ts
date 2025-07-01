import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';

interface Tournament {
  id: string;
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
}

@Component({
  selector: 'app-tournament-edit',
  templateUrl: './tournament-edit.component.html',
  styleUrls: ['./tournament-edit.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class TournamentEditComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/api/TournamentSettings`;
  tournamentForm: FormGroup;
  tournamentId: string | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder
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
      startingScore: [25000, Validators.required]
    });
  }

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.paramMap.get('id');
    if (this.tournamentId) {
      this.http.get<Tournament>(`${this.apiUrl}/${this.tournamentId}`).subscribe(tournament => {
        this.tournamentForm.patchValue(tournament);
        this.isLoading = false;
      });
    } else {
      this.isLoading = false;
    }
  }

  onGameTypeSelectionChange(): void {
    const gameType = this.tournamentForm.get('gameType')?.value;
    const playerCount = gameType === 'サンマ' ? 3 : 4;
    this.tournamentForm.patchValue({ playerCount: playerCount });
  }

  onSubmit(): void {
    if (this.tournamentForm.valid && this.tournamentId) {
      this.isSubmitting = true;
      const tournamentData = this.tournamentForm.value;
      this.http.put(`${this.apiUrl}/${this.tournamentId}`, tournamentData).subscribe({
        next: () => this.router.navigate(['/events', this.tournamentId]),
        error: (err) => {
          console.error(err);
          this.errorMessage = '更新に失敗しました。';
          this.isSubmitting = false;
        }
      });
    }
  }
}
