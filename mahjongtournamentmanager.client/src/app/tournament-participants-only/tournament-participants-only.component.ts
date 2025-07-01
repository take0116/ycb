import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { ScheduleCoordinatorComponent } from '../schedule-coordinator/schedule-coordinator.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tournament-participants-only',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ScheduleCoordinatorComponent],
  templateUrl: './tournament-participants-only.component.html',
  styleUrls: ['./tournament-participants-only.component.css']
})
export class TournamentParticipantsOnlyComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/api/TournamentSettings`;
  tournamentId: number | null = null;
  tournamentName: string = '';
  participants: any[] = [];
  message: string = '';
  playerCount: number = 0;
  groupedMatchTables: { tableName: string, data: any[] }[] = [];
  matchSettingsForm: FormGroup;
  isTableSaved: boolean = false;
  isParticipantsVisible: boolean = false;
  
  isCoordinatorVisible = false;
  selectedRoundInfo: { matchId: number, round: string, schedulingStartDate: string } | null = null;
  selectedMatchPlayers: { id: string, name: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public authService: AuthService
  ) {
    this.matchSettingsForm = new FormGroup({
      minMatchesPerParticipant: new FormControl(1, [Validators.required, Validators.min(1)])
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tournamentId = +id;
        this.getTournamentData(this.tournamentId);
      }
    });
  }

  getTournamentData(tournamentId: number): void {
    this.http.get<any>(`${this.apiUrl}/${tournamentId}`).subscribe({
      next: (settings) => {
        this.tournamentName = settings.tournamentName;
        this.playerCount = settings.playerCount;
        this.isTableSaved = settings.isTableLocked;
        if (this.isTableSaved) {
          this.getSavedMatches(tournamentId);
        }
        this.getParticipants(tournamentId);
      },
      error: (error) => {
        console.error('Error fetching tournament settings', error);
        this.message = '大会情報の取得に失敗しました。';
      }
    });
  }

  getParticipants(tournamentId: number): void {
    this.http.get<any>(`${this.apiUrl}/${tournamentId}/participants`).subscribe({
      next: (data) => {
        this.participants = data.participants;
      },
      error: (error) => console.error('Error fetching participants', error)
    });
  }

  getSavedMatches(tournamentId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/${tournamentId}/matches`).subscribe({
      next: (matches) => this.reconstructMatchTables(matches),
      error: (error) => {
        console.error('Error fetching saved matches', error);
        this.message = '保存された対戦表の読み込みに失敗しました。';
      }
    });
  }

  reconstructMatchTables(matches: any[]): void {
    if (matches.length === 0) return;
    const tables: { [key: string]: { tableName: string, data: any[] } } = {};
    matches.forEach(match => {
      const tableNumber = match.mahjongMatchPlayers[0]?.tableNumber;
      if (!tableNumber) return;
      const tableName = String.fromCharCode(64 + tableNumber) + '卓';
      if (!tables[tableName]) {
        const headerRow = ['№', ...Array.from({ length: this.playerCount }, (_, i) => `ユーザー名${i + 1}`), '抜け番'];
        tables[tableName] = { tableName, data: [headerRow] };
      }
      
      const playerInfo = match.mahjongMatchPlayers.map((p: any) => ({ id: p.user.id, name: p.user.userName }));
      const playerNames = playerInfo.map((p: any) => p.name);
      
      const paddedPlayerNames = [...playerNames];
      while (paddedPlayerNames.length < this.playerCount) {
        paddedPlayerNames.push('-');
      }

      const rowData = {
        matchId: match.id,
        round: match.round.toString(),
        players: playerInfo,
        displayCells: [match.round.toString(), ...paddedPlayerNames, match.byePlayerUserNames || '-'],
        schedulingStartDate: match.schedulingStartDate
      };
      
      tables[tableName].data.push(rowData);
    });
    Object.values(tables).forEach(table => {
      table.data.sort((a, b) => {
        if (Array.isArray(a)) return -1; // Header
        if (Array.isArray(b)) return 1;  // Header
        return parseInt(a.round) - parseInt(b.round);
      });
    });
    this.groupedMatchTables = Object.values(tables);
  }

  isUserInMatch(row: any): boolean {
    const currentUserId = this.authService.getUserId();
    if (!currentUserId || !row.players) {
      return false;
    }
    return row.players.some((player: any) => player.id === currentUserId);
  }

  toggleParticipantsVisibility(): void {
    this.isParticipantsVisible = !this.isParticipantsVisible;
  }

  saveSchedulingStartDate(row: any, tableName: string): void {
    const dateInput = document.getElementById(`schedule-date-${tableName}-${row.round}`) as HTMLInputElement;
    const newDate = dateInput.value ? `"${dateInput.value}"` : null;

    this.http.put(`${this.apiUrl}/matches/${row.matchId}/schedule-start`, newDate, {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => {
        this.message = `第${row.round}回戦の日程調整開始日を保存しました。`;
        row.schedulingStartDate = dateInput.value || null;
      },
      error: (err) => {
        console.error(err);
        this.message = '日付の保存に失敗しました。';
      }
    });
  }

  openCoordinator(row: any): void {
    this.selectedRoundInfo = {
      matchId: row.matchId,
      round: row.round,
      schedulingStartDate: row.schedulingStartDate
    };
    this.selectedMatchPlayers = row.players;
    this.isCoordinatorVisible = true;
    this.message = '';
  }

  closeCoordinator(): void {
    this.isCoordinatorVisible = false;
  }

  unlockMatchTable(): void {
    if (!this.tournamentId) return;
    this.http.post(`${this.apiUrl}/${this.tournamentId}/unlock-match-table`, {}).subscribe({
      next: () => {
        this.message = '対戦表が削除され、大会は再び募集中になりました。';
        this.isTableSaved = false;
        this.groupedMatchTables = [];
        if (this.tournamentId) this.getTournamentData(this.tournamentId);
      },
      error: (error) => {
        console.error('Error unlocking match table', error);
        this.message = error.error?.message || '対戦表の削除に失敗しました。';
      }
    });
  }

  saveMatchTable(): void {
    if (!this.tournamentId || this.groupedMatchTables.length === 0) return;
    const payload = { groupedMatchTables: this.groupedMatchTables };
    this.http.post(`${this.apiUrl}/${this.tournamentId}/save-match-table`, payload).subscribe({
      next: () => {
        this.message = '対戦表が正常に保存されました。';
        if (this.tournamentId) this.getTournamentData(this.tournamentId);
      },
      error: (error) => {
        console.error('Error saving match table', error);
        this.message = error.error?.message || '対戦表の保存に失敗しました。';
      }
    });
  }

  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  private lcm(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / this.gcd(a, b) || 0;
  }

  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  generateMatchTable(): void {
    if (this.matchSettingsForm.invalid) {
      this.message = '最低試合数を正しく入力してください。';
      return;
    }
    const minMatchesPerParticipant = this.matchSettingsForm.get('minMatchesPerParticipant')?.value;
    const numActualParticipants = this.participants.length;
    const numPlayersPerMatch = this.playerCount;

    if (numActualParticipants < numPlayersPerMatch) {
      this.message = '参加者数が卓の人数に満たないため、対戦表を生成できません。';
      return;
    }

    const numSimultaneousTables = Math.floor(numActualParticipants / numPlayersPerMatch);
    const numByesPerRound = numActualParticipants % numPlayersPerMatch;
    
    const allParticipants: { id: string, name: string }[] = this.participants.map(p => ({ id: p.user.id, name: p.user.userName }));
    const allParticipantNames = allParticipants.map(p => p.name);

    this.groupedMatchTables = Array.from({ length: numSimultaneousTables }, (_, t) => {
      const tableName = String.fromCharCode(65 + t) + '卓';
      const headerRow = ['№', ...Array.from({ length: numPlayersPerMatch }, (__, i) => `ユーザー名${i + 1}`), '抜け番'];
      return { tableName, data: [headerRow] };
    });

    if (numByesPerRound === 0) {
      let round = 1;
      const matchCounts: { [key: string]: number } = Object.fromEntries(allParticipantNames.map(name => [name, 0]));
      while (Object.values(matchCounts).some(c => c < minMatchesPerParticipant)) {
        if (round > 200) { this.message = '対戦数が多すぎるため中断しました。'; break; }
        let playingThisRound = this.shuffleArray([...allParticipantNames]);
        for (let t = 0; t < numSimultaneousTables; t++) {
          const matchPlayerNames = playingThisRound.splice(0, numPlayersPerMatch);
          matchPlayerNames.forEach(p => matchCounts[p]++);
          
          const matchPlayers = allParticipants.filter(p => matchPlayerNames.includes(p.name));
          const rowData = {
            matchId: 0,
            round: round.toString(),
            players: matchPlayers,
            displayCells: [`${round}`, ...matchPlayerNames, '-']
          };
          this.groupedMatchTables[t].data.push(rowData);
        }
        round++;
      }
      this.message = `${round - 1}回戦の対戦表を生成しました。`;
      return;
    }

    const roundsInOneCycle = this.lcm(numByesPerRound, numActualParticipants) / numByesPerRound;
    const matchesInOneCycle = roundsInOneCycle - (roundsInOneCycle * numByesPerRound / numActualParticipants);
    
    let cyclesNeeded = 1;
    if (matchesInOneCycle > 0) {
      cyclesNeeded = Math.ceil(minMatchesPerParticipant / matchesInOneCycle);
    }
    
    const totalRounds = roundsInOneCycle * cyclesNeeded;

    let byePool: string[] = [];
    for (let i = 0; i < cyclesNeeded; i++) {
      byePool.push(...this.shuffleArray([...allParticipantNames]));
    }

    for (let round = 1; round <= totalRounds; round++) {
      const byesThisRound = byePool.splice(0, numByesPerRound);
      const playingThisRoundNames = this.shuffleArray(allParticipantNames.filter(p => !byesThisRound.includes(p)));
      const byeDisplayString = byesThisRound.join(', ') || '-';

      for (let t = 0; t < numSimultaneousTables; t++) {
        const matchPlayerNames = playingThisRoundNames.splice(0, numPlayersPerMatch);
        const matchPlayers = allParticipants.filter(p => matchPlayerNames.includes(p.name));
        
        const paddedPlayerNames = [...matchPlayerNames];
        while (paddedPlayerNames.length < numPlayersPerMatch) {
            paddedPlayerNames.push('-');
        }

        const rowData = {
            matchId: 0,
            round: round.toString(),
            players: matchPlayers,
            displayCells: [`${round}`, ...paddedPlayerNames, byeDisplayString]
        };
        this.groupedMatchTables[t].data.push(rowData);
      }
    }
    
    const finalMatchCount = totalRounds - (totalRounds * numByesPerRound / numActualParticipants);
    this.message = `全参加者の抜け番回数を均等にし、最低${minMatchesPerParticipant}試合を保証するため、${totalRounds}回戦（1人あたり${finalMatchCount}試合）の対戦表を生成しました。`;
  }
}
