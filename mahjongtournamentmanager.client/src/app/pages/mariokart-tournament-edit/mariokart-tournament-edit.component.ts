import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-mariokart-tournament-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mariokart-tournament-edit.component.html',
  styleUrls: ['./mariokart-tournament-edit.component.css']
})
export class MarioKartTournamentEditComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/api/MarioKartTournaments`;
  tournamentForm: FormGroup;
  tournamentId: string | null = null;
  users: any[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient,
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.tournamentForm = this.fb.group({
      id: [null],
      tournamentName: ['', Validators.required],
      eventDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      gameMode: ['', Validators.required],
      comment: [''],
      status: [1, Validators.required],
      maxParticipants: [null, [Validators.min(1), Validators.max(24)]],
      isPrivate: [false],
      invitedUserIds: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.paramMap.get('id');
    this.loadUsers();
    if (this.tournamentId) {
      this.loadTournamentData();
    } else {
      this.isLoading = false;
    }
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => this.users = users,
      error: (err) => this.errorMessage = 'ユーザーの読み込みに失敗しました。'
    });
  }

  loadTournamentData(): void {
    this.http.get<any>(`${this.apiUrl}/${this.tournamentId}`).subscribe({
      next: (data) => {
        this.tournamentForm.patchValue(data);
        const invitedUserIds = this.tournamentForm.get('invitedUserIds') as FormArray;
        data.invitedUserIds.forEach((id: string) => {
          invitedUserIds.push(this.fb.control(id));
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = '大会データの読み込みに失敗しました。';
        this.isLoading = false;
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
      let errorDetails = '入力内容に誤りがあります。以下の項目を確認してください:';
      Object.keys(this.tournamentForm.controls).forEach(key => {
        const control = this.tournamentForm.get(key);
        if (control && control.invalid) {
          console.log(`Invalid control: ${key}, Errors:`, control.errors);
          errorDetails += `\n- ${key}`;
        }
      });
      this.errorMessage = errorDetails;
      return;
    }

    const formData = this.tournamentForm.value;
    const request = this.tournamentId
      ? this.http.put(`${this.apiUrl}/${this.tournamentId}`, formData)
      : this.http.post(this.apiUrl, formData);

    request.subscribe({
      next: () => this.router.navigate(['/events']),
      error: (err) => {
        console.error('Save failed:', err);
        this.errorMessage = '保存に失敗しました。';
      }
    });
  }
}
