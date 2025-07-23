import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

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
  private marioKartApiUrl = `${environment.apiUrl}/api/MarioKartTournaments`;
  tournamentForm: FormGroup;
  splatoonTournamentForm: FormGroup;
  marioKartTournamentForm: FormGroup;
  isSubmitting = false;
  selectedGameType: string = '雀魂';
  startingScoreOptions: number[] = [25000, 30000, 35000];
  message: string = '';
  users: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService
  ) {
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
      description: [''],
      isPrivate: [false],
      invitedUsers: this.fb.array([])
    });

    this.splatoonTournamentForm = this.fb.group({
      tournamentName: ['', Validators.required],
      eventDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      gameMode: ['プライベートマッチ', Validators.required],
      status: [1, Validators.required],
      comment: [''],
      maxParticipants: [null, [Validators.min(1)]],
      isPrivate: [false],
      invitedUsers: this.fb.array([])
    });

    this.marioKartTournamentForm = this.fb.group({
      tournamentName: ['', Validators.required],
      eventDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      gameMode: ['個人戦', Validators.required],
      status: [1, Validators.required],
      comment: [''],
      maxParticipants: [null, [Validators.min(1), Validators.max(24)]],
      isPrivate: [false],
      invitedUsers: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.onGameTypeSelectionChange();
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users: any[]) => {
        this.users = users;
        console.log('Users loaded:', this.users);
      },
      error: (err: any) => {
        console.error('Failed to load users', err);
        this.message = 'ユーザーリストの読み込みに失敗しました。';
      }
    });
  }

  onGameTypeSelectionChange(): void {
    const gameType = this.tournamentForm.get('gameType')?.value;
    const playerCount = gameType === 'サンマ' ? 3 : 4;
    this.tournamentForm.patchValue({ playerCount: playerCount });
  }

  onUserSelectionChange(event: any, form: FormGroup): void {
    const invitedUsers = form.get('invitedUsers') as FormArray;

    if (event.target.checked) {
      invitedUsers.push(this.fb.control(event.target.value));
    } else {
      const index = invitedUsers.controls.findIndex(x => x.value === event.target.value);
      if (index !== -1) {
        invitedUsers.removeAt(index);
      }
    }
  }

  createTournament(): void {
    let form: FormGroup;
    let apiUrl: string;

    switch (this.selectedGameType) {
      case '雀魂':
        form = this.tournamentForm;
        apiUrl = this.mahjongApiUrl;
        break;
      case 'スプラトゥーン':
        form = this.splatoonTournamentForm;
        apiUrl = this.splatoonApiUrl;
        break;
      case 'マリオカート':
        form = this.marioKartTournamentForm;
        apiUrl = this.marioKartApiUrl;
        break;
      default:
        this.message = '無効なゲームタイプです。';
        return;
    }

    if (form.invalid) {
      this.message = '入力内容に誤りがあります。';
      return;
    }

    this.isSubmitting = true;
    const tournamentData = form.value;

    this.http.post(apiUrl, tournamentData).subscribe({
      next: () => this.router.navigate(['/events']),
      error: (err: any) => {
        console.error(err);
        this.isSubmitting = false;
        this.message = '作成に失敗しました。';
      }
    });
  }
}
