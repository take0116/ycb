import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { UserService } from '../../services/user.service';

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
  startingScoreOptions: number[] = [];
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
      description: [''],
      playerCount: [4, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      gameType: ['ヨンマ', Validators.required],
      thinkTime: ['60+0', Validators.required],
      allowFlying: [true],
      redDora: [true],
      startingScore: [25000, Validators.required],
      status: [1, Validators.required],
      isPrivate: [false],
      invitedUsers: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.tournamentId = this.route.snapshot.paramMap.get('id');
    if (this.tournamentId) {
      this.http.get<any>(`${this.apiUrl}/${this.tournamentId}`).subscribe({
        next: tournament => {
          // Format dates before patching
          const formattedTournament = {
            ...tournament,
            startDate: tournament.startDate.split('T')[0],
            endDate: tournament.endDate.split('T')[0]
          };
          this.tournamentForm.patchValue(formattedTournament);
          const invitedUsers = this.tournamentForm.get('invitedUsers') as FormArray;
          // Clear existing controls before patching
          while (invitedUsers.length) {
            invitedUsers.removeAt(0);
          }
          tournament.invitedUsers.forEach((user: any) => {
            invitedUsers.push(this.fb.control(user.userId));
          });
          this.onGameTypeSelectionChange(); // Set initial score options
          this.isLoading = false;
        },
        error: (err) => {
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

  onGameTypeSelectionChange(): void {
    const gameType = this.tournamentForm.get('gameType')?.value;
    const playerCount = gameType === 'サンマ' ? 3 : 4;
    this.tournamentForm.patchValue({ playerCount: playerCount });
    this.startingScoreOptions = gameType === 'サンマ' ? [35000, 40000] : [25000, 30000];
    if (!this.startingScoreOptions.includes(this.tournamentForm.get('startingScore')?.value)) {
      this.tournamentForm.patchValue({ startingScore: this.startingScoreOptions[0] });
    }
  }

  onUserSelectionChange(event: any): void {
    const invitedUsers = this.tournamentForm.get('invitedUsers') as FormArray;

    if (event.target.checked) {
      invitedUsers.push(this.fb.control(event.target.value));
    } else {
      const index = invitedUsers.controls.findIndex(x => x.value === event.target.value);
      if (index !== -1) {
        invitedUsers.removeAt(index);
      }
    }
  }

  isUserInvited(userId: string): boolean {
    const invitedUsers = this.tournamentForm.get('invitedUsers') as FormArray;
    return invitedUsers.value.includes(userId);
  }

  onSubmit(): void {
    if (this.tournamentId && this.tournamentForm.valid) {
      this.isSubmitting = true;
      const tournamentData = this.tournamentForm.value;
      // invitedUsersの値を UserId のみのオブジェクトの配列に変換
      tournamentData.invitedUsers = tournamentData.invitedUsers.map((id: string) => ({ userId: id }));
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

  goBack(): void {
    this.location.back();
  }
}