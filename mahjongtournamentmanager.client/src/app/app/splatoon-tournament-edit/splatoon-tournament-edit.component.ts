import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-splatoon-tournament-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './splatoon-tournament-edit.component.html',
  styleUrls: ['./splatoon-tournament-edit.component.css']
})
export class SplatoonTournamentEditComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/api/SplatoonTournaments`;
  tournamentForm: FormGroup;
  tournamentId: string | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private location: Location
  ) {
    this.tournamentForm = this.fb.group({
      id: [0],
      tournamentName: ['', Validators.required],
      eventDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      gameMode: ['', Validators.required],
      comment: ['']
    });
  }

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.paramMap.get('id');
    if (this.tournamentId) {
      this.http.get<any>(`${this.apiUrl}/${this.tournamentId}`).subscribe(tournament => {
        this.tournamentForm.patchValue(tournament);
        this.isLoading = false;
      });
    } else {
      this.isLoading = false;
    }
  }

  onSubmit(): void {
    if (this.tournamentForm.valid && this.tournamentId) {
      const tournamentData = this.tournamentForm.value;
      this.http.put(`${this.apiUrl}/${this.tournamentId}`, tournamentData).subscribe({
        next: () => this.router.navigate(['/splatoon-event', this.tournamentId]),
        error: (err) => {
          console.error(err);
          this.errorMessage = '更新に失敗しました。';
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }
}
