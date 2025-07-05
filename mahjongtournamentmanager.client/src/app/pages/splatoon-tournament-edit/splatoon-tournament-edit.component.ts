import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { UserService } from '../../services/user.service';

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
  isEditMode = false;
  isLoading = true;
  errorMessage = '';
  users: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private location: Location,
    private userService: UserService
  ) {
    this.tournamentForm = this.fb.group({
      id: [0],
      tournamentName: ['', Validators.required],
      eventDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      gameMode: ['', Validators.required],
      comment: [''],
      status: [1], // Default to 'Recruiting'
      maxParticipants: [null, [Validators.min(1)]],
      isPrivate: [false],
      invitedUserIds: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.tournamentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.tournamentId;

    if (this.isEditMode) {
      this.http.get<any>(`${this.apiUrl}/${this.tournamentId}`).subscribe({
        next: tournament => {
          this.tournamentForm.patchValue(tournament);
          const invitedUserIds = this.tournamentForm.get('invitedUserIds') as FormArray;
          tournament.invitedUserIds.forEach((id: string) => {
            invitedUserIds.push(this.fb.control(id));
          });
          this.isLoading = false;
        },
        error: err => {
          console.error(err);
          this.errorMessage = '企画の読み込みに失敗しました。';
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users: any[]) => {
        this.users = users;
      },
      error: (err: any) => {
        console.error('Failed to load users', err);
        this.errorMessage = 'ユーザーリストの読み込みに失敗しました。';
      }
    });
  }

  onUserSelectionChange(event: any): void {
    const invitedUserIds = this.tournamentForm.get('invitedUserIds') as FormArray;

    if (event.target.checked) {
      invitedUserIds.push(this.fb.control(event.target.value));
    } else {
      const index = invitedUserIds.controls.findIndex(x => x.value === event.target.value);
      if (index !== -1) {
        invitedUserIds.removeAt(index);
      }
    }
  }

  isUserInvited(userId: string): boolean {
    const invitedUserIds = this.tournamentForm.get('invitedUserIds') as FormArray;
    return invitedUserIds.value.includes(userId);
  }

  onSubmit(): void {
    if (this.tournamentForm.invalid) {
      this.errorMessage = 'すべての必須項目を入力してください。';
      return;
    }

    const tournamentData = this.tournamentForm.value;
    let submission: Observable<any>;

    if (this.isEditMode) {
      // Update existing tournament
      submission = this.http.put(`${this.apiUrl}/${this.tournamentId}`, tournamentData);
    } else {
      // Create new tournament
      submission = this.http.post(this.apiUrl, tournamentData);
    }

    submission.subscribe({
      next: (result: any) => {
        const newOrUpdatedId = this.isEditMode ? this.tournamentId : result.id;
        this.router.navigate(['/splatoon-event', newOrUpdatedId]);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = this.isEditMode ? '更新に失敗しました。' : '作成に失敗しました。';
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
