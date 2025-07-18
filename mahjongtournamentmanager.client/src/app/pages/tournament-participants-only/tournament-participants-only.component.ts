import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ScheduleCoordinatorComponent } from '../schedule-coordinator/schedule-coordinator.component';
import { environment } from '../../../environments/environment';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tournament-participants-only',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ScheduleCoordinatorComponent, RouterModule, DragDropModule],
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
  isMatchTablesVisible: boolean = false;
  isResultFormVisible: boolean = false;
  isPlayerStatsVisible: boolean = false;
  
  isCoordinatorVisible = false;
  selectedRoundInfo: { matchId: number, round: string, schedulingStartDate: string } | null = null;
  selectedMatchPlayers: { id: string, name: string }[] = [];
  isAdmin: boolean = false;
  playerStats: any[] = [];

  // Team Formation Properties
  unassignedParticipants: any[] = [];
  teams: { name: string, participants: any[] }[] = [];

  matchAvailabilities: { [matchId: number]: Set<string> } = {};
  matchScores: { [matchId: string]: { [userId: string]: number | null } } = {};

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
    this.isAdmin = this.authService.hasRole('Admin');
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
        this.initializeTeams();
      },
      error: (error) => console.error('Error fetching participants', error)
    });
  }

  getSavedMatches(tournamentId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/${tournamentId}/matches`).subscribe({
      next: (matches) => {
        if (matches && matches.length > 0) {
          this.fetchAndProcessAvailabilities(matches);
        } else {
          this.reconstructMatchTables([]);
        }
      },
      error: (error) => {
        console.error('Error fetching saved matches', error);
        this.message = '保存された対戦表の読み込みに失敗しました。';
      }
    });
  }

  fetchAndProcessAvailabilities(matches: any[]): void {
    const availabilityRequests = matches
      .filter(match => match.id > 0)
      .map(match => 
        this.http.get<any[]>(`${this.apiUrl}/${match.id}/availabilities`).pipe(
          map(availabilities => ({ matchId: match.id, availabilities })),
          catchError(err => {
            console.error(`Failed to fetch availabilities for match ${match.id}`, err);
            return of({ matchId: match.id, availabilities: [] });
          })
        )
      );

    if (availabilityRequests.length === 0) {
      this.reconstructMatchTables(matches);
      return;
    }

    forkJoin(availabilityRequests).subscribe({
      next: (results) => {
        const newAvailabilities: { [matchId: number]: Set<string> } = {};
        results.forEach(result => {
          const userIds = new Set<string>();
          result.availabilities.forEach(avail => userIds.add(avail.userId));
          newAvailabilities[result.matchId] = userIds;
        });
        this.matchAvailabilities = newAvailabilities;
        this.reconstructMatchTables(matches);
      },
      error: (error) => {
        console.error('Error fetching one or more match availabilities', error);
        this.reconstructMatchTables(matches);
      }
    });
  }

  hasUserSubmittedAvailability(matchId: number, userId: string): boolean {
    return this.matchAvailabilities[matchId]?.has(userId) ?? false;
  }

  reconstructMatchTables(matches: any[]): void {
    if (matches.length === 0) return;
    const tables: { [key: string]: { tableName: string, data: any[] } } = {};
    matches.forEach(match => {
      this.matchScores[match.id] = {};
      match.mahjongMatchPlayers.forEach((p: any) => {
        this.matchScores[match.id][p.user.id] = p.score;
      });

      const tableNumber = match.mahjongMatchPlayers[0]?.tableNumber;
      if (!tableNumber) return;
      const tableName = String.fromCharCode(64 + tableNumber) + '卓';
      if (!tables[tableName]) {
        const headerRow = ['№', '対戦ユーザー', '抜け番', '開催期間'];
        tables[tableName] = { tableName, data: [headerRow] };
      }
      
      const playerInfo = match.mahjongMatchPlayers.map((p: any) => ({ id: p.user.id, name: p.user.userName }));
      const byeUserNames = match.byePlayerUserNames ? match.byePlayerUserNames.split(', ') : [];
      
      const rowData = {
        matchId: match.id,
        round: match.round.toString(),
        players: playerInfo,
        byePlayers: byeUserNames,
        displayCells: [match.round.toString(), '', '', this.getSchedulePeriod(match.schedulingStartDate)],
        schedulingStartDate: match.schedulingStartDate
      };
      
      tables[tableName].data.push(rowData);
    });
    Object.values(tables).forEach(table => {
      table.data.sort((a, b) => {
        if (Array.isArray(a)) return -1;
        if (Array.isArray(b)) return 1;
        return parseInt(a.round) - parseInt(b.round);
      });
    });
    this.groupedMatchTables = Object.values(tables);
    this.calculatePlayerStats();
  }

  calculatePlayerStats(): void {
    const stats: { [userId: string]: { name: string, totalScore: number, matchCount: number, scores: number[] } } = {};

    // Initialize stats for all participants
    this.participants.forEach(p => {
      stats[p.user.id] = {
        name: p.user.userName,
        totalScore: 0,
        matchCount: 0,
        scores: []
      };
    });

    // Aggregate scores from all matches
    this.groupedMatchTables.forEach(table => {
      table.data.slice(1).forEach(row => {
        const scoresInMatch = this.matchScores[row.matchId];
        if (scoresInMatch) {
          row.players.forEach((player: any) => {
            const score = scoresInMatch[player.id];
            if (score !== null && score !== undefined) {
              if (stats[player.id]) {
                stats[player.id].totalScore += score;
                stats[player.id].matchCount++;
                stats[player.id].scores.push(score);
              }
            }
          });
        }
      });
    });

    this.playerStats = Object.values(stats)
      .sort((a, b) => b.totalScore - a.totalScore)
      .map(s => ({
        ...s,
        totalScore: s.totalScore.toFixed(1),
        averageScore: s.matchCount > 0 ? (s.totalScore / s.matchCount).toFixed(1) : 0,
        maxScore: s.matchCount > 0 ? Math.max(...s.scores) : 0,
        minScore: s.matchCount > 0 ? Math.min(...s.scores) : 0
      }));
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

  toggleMatchTablesVisibility(): void {
    this.isMatchTablesVisible = !this.isMatchTablesVisible;
  }

  saveSchedulingStartDate(row: any, tableName: string): void {
    if (confirm('日程調整開始日を変更します。よろしいですか？（既存の出欠登録はリセットされます）')) {
      const dateInput = document.getElementById(`schedule-date-${tableName}-${row.round}`) as HTMLInputElement;
      const newDate = dateInput.value ? `"${dateInput.value}"` : null;

      this.http.put(`${this.apiUrl}/matches/${row.matchId}/schedule-start`, newDate, {
        headers: { 'Content-Type': 'application/json' }
      }).subscribe({
        next: () => {
          this.message = `第${row.round}回戦の日程調整開始日を保存しました。`;
          row.schedulingStartDate = dateInput.value || null;
          // Manually update the display cell for the schedule period
          const tableData = this.groupedMatchTables.find(t => t.tableName === tableName)?.data;
          if (tableData) {
            const rowIndex = tableData.findIndex(r => !Array.isArray(r) && r.matchId === row.matchId);
            if (rowIndex > -1) {
              tableData[rowIndex].displayCells[3] = this.getSchedulePeriod(row.schedulingStartDate);
            }
          }
        },
        error: (err) => {
          console.error(err);
          this.message = '日付の保存に失敗しました。';
        }
      });
    }
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

  closeCoordinator(saved: boolean): void {
    this.isCoordinatorVisible = false;
    if (saved && this.isTableSaved) {
      // Re-fetch the data to update the highlights
      this.getSavedMatches(this.tournamentId!);
    }
  }

  getSchedulePeriod(startDate: string | null): string {
    if (!startDate) {
      return '';
    }
    try {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 14); // 2週間後

      const formatDate = (date: Date) => {
        const m = ('0' + (date.getMonth() + 1)).slice(-2);
        const d = ('0' + date.getDate()).slice(-2);
        return `${m}/${d}`;
      };

      return `${formatDate(start)} - ${formatDate(end)}`;
    } catch (e) {
      console.error('Invalid date format for scheduling start date:', startDate);
      return '期間の計算に失敗';
    }
  }

  unlockMatchTable(): void {
    if (confirm('対戦表を削除し、大会を再び募集中にします。よろしいですか？')) {
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

    const isTeamMode = this.teams.length > 0 && this.unassignedParticipants.length === 0;

    if (isTeamMode) {
      this.generateTeamBasedMatchTable();
    } else {
      this.generateRandomMatchTable();
      if (this.teams.length > 0 && this.unassignedParticipants.length > 0) {
        this.message = '未割り当ての参加者がいるため、チームを考慮せずランダムに対戦表を生成しました。\n' + this.message;
      }
    }
  }

  private generateTeamBasedMatchTable(): void {
    const minMatchesPerParticipant = this.matchSettingsForm.get('minMatchesPerParticipant')?.value;
    const numPlayersPerMatch = this.playerCount;
    const numTeams = this.teams.length;

    if (this.teams.some(t => t.participants.length === 0)) {
      this.message = '参加者が0人のチームがあるため、チームベースの対戦表を生成できません。';
      return;
    }
    
    const allParticipantsFromTeams = this.teams.flatMap(t => t.participants.map(p => ({ ...p, teamName: t.name })));
    const numActualParticipants = allParticipantsFromTeams.length;

    if (numActualParticipants < numPlayersPerMatch) {
      this.message = '参加者数が卓の人数に満たないため、対戦表を生成できません。';
      return;
    }

    const numSimultaneousTables = Math.floor(numActualParticipants / numPlayersPerMatch);
    const numPlayersInMatches = numSimultaneousTables * numPlayersPerMatch;

    this.groupedMatchTables = Array.from({ length: numSimultaneousTables }, (_, t) => {
      const tableName = String.fromCharCode(65 + t) + '卓';
      const headerRow = ['№', '対戦ユーザー', '抜け番', '開催期間'];
      return { tableName, data: [headerRow] };
    });

    // --- New Logic: Loop until min matches is met for all ---

    const teamPlayerQueues = new Map<string, any[]>();
    this.teams.forEach(team => {
      teamPlayerQueues.set(team.name, this.shuffleArray([...team.participants]));
    });

    const matchCountPerPlayer = new Map<string, number>();
    allParticipantsFromTeams.forEach(p => matchCountPerPlayer.set(p.userId, 0));

    let totalRounds = 0;
    
    // Loop until everyone has played enough matches
    while (Array.from(matchCountPerPlayer.values()).some(count => count < minMatchesPerParticipant)) {
        totalRounds++;
        if (totalRounds > 100) { // Safety break for infinite loops
          this.message = '試合数が多すぎます。設定を確認してください。';
          return;
        }
        
        // Select players for this round by "dealing" from each team's queue
        const playersForThisRound: any[] = [];
        let teamSelectionOrder = this.shuffleArray(this.teams.map(t => t.name));
        
        while (playersForThisRound.length < numPlayersInMatches) {
            let playerAddedInCycle = false;
            for (const teamName of teamSelectionOrder) {
                if (playersForThisRound.length >= numPlayersInMatches) break;
                
                const queue = teamPlayerQueues.get(teamName)!;
                if (queue.length > 0) {
                    const player = queue.shift()!;
                    queue.push(player); // Move player to the back of the queue
                    
                    playersForThisRound.push(player);
                    playerAddedInCycle = true;
                }
            }
            if (!playerAddedInCycle) break; // No more players available in any team
        }

        // Update match counts for players in this round
        playersForThisRound.forEach(p => {
            matchCountPerPlayer.set(p.userId, (matchCountPerPlayer.get(p.userId) || 0) + 1);
        });

        // Determine byes for this round
        const playingUserIds = new Set(playersForThisRound.map(p => p.userId));
        const byeParticipants = allParticipantsFromTeams.filter(p => !playingUserIds.has(p.userId));
        const byeDisplayString = byeParticipants.map(p => p.user.userName).join(', ') || '-';

        // Distribute players to tables
        const shuffledPlayersForRound = this.shuffleArray(playersForThisRound);
        const roundTables: any[][] = Array.from({ length: numSimultaneousTables }, () => []);
        for (let i = 0; i < shuffledPlayersForRound.length; i++) {
            roundTables[i % numSimultaneousTables].push(shuffledPlayersForRound[i]);
        }

        // Format and add rows to the display table
        roundTables.forEach((matchPlayers, tableIdx) => {
            if (matchPlayers.length === 0) return;
            const matchPlayerNames = matchPlayers.map(p => p.user.userName);
            const matchPlayerInfo = matchPlayers.map(p => ({ id: p.user.id, name: p.user.userName }));

            const rowData = {
                matchId: 0,
                round: totalRounds.toString(),
                players: matchPlayerInfo,
                displayCells: [`${totalRounds}`, matchPlayerNames.join(', '), byeDisplayString, '']
            };
            this.groupedMatchTables[tableIdx].data.push(rowData);
        });
    }

    const avgMatchCount = Array.from(matchCountPerPlayer.values()).reduce((a, b) => a + b, 0) / matchCountPerPlayer.size;
    this.message = `チーム構成の偏りをなくし、最低${minMatchesPerParticipant}試合の条件を満たすため、${totalRounds}回戦（1人あたり平均${avgMatchCount.toFixed(1)}試合）の対戦表を生成しました。`;
  }

  private generateRandomMatchTable(): void {
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
      const headerRow = ['№', '対戦ユーザー', '抜け番', '開催期間'];
      return { tableName, data: [headerRow] };
    });

    // --- Case with no byes (simple logic) ---
    if (numByesPerRound === 0) {
      const totalRounds = minMatchesPerParticipant;
      for (let round = 1; round <= totalRounds; round++) {
        let playingThisRound = this.shuffleArray([...allParticipantNames]);
        for (let t = 0; t < numSimultaneousTables; t++) {
          const matchPlayerNames = playingThisRound.splice(0, numPlayersPerMatch);
          const matchPlayers = allParticipants.filter(p => matchPlayerNames.includes(p.name));
          const rowData = {
            matchId: 0,
            round: round.toString(),
            players: matchPlayers,
            displayCells: [`${round}`, matchPlayerNames.join(', '), '-', '']
          };
          this.groupedMatchTables[t].data.push(rowData);
        }
      }
      this.message = `${totalRounds}回戦の対戦表を生成しました。`;
      return;
    }

    // --- Case with byes (GUARANTEED FAIR LOGIC) ---
    // Calculate the number of rounds for one full, fair bye rotation.
    const roundsInOneFairCycle = numActualParticipants / this.gcd(numActualParticipants, numByesPerRound);

    // Calculate how many matches each person plays in that one cycle.
    const matchesPerParticipantInCycle = roundsInOneFairCycle - (roundsInOneFairCycle * numByesPerRound / numActualParticipants);

    if (matchesPerParticipantInCycle <= 0) {
        this.message = '対戦設定が不正です。試合が成立しません。';
        return;
    }
    // Determine how many full cycles are needed to meet the minimum match requirement.
    const cyclesNeeded = Math.ceil(minMatchesPerParticipant / matchesPerParticipantInCycle);

    // The total rounds must be a multiple of the fair cycle length to ensure equal byes.
    const totalRounds = roundsInOneFairCycle * cyclesNeeded;

    // Use a circular queue for fair bye distribution
    let byeCandidates = this.shuffleArray([...allParticipantNames]);

    for (let round = 1; round <= totalRounds; round++) {
      // Select byes from the front of the queue
      const byesThisRound = byeCandidates.slice(0, numByesPerRound);
      // Rotate the queue for the next round
      byeCandidates = [...byeCandidates.slice(numByesPerRound), ...byesThisRound];

      const playingThisRoundNames = this.shuffleArray(allParticipantNames.filter(p => !byesThisRound.includes(p)));
      
      for (let t = 0; t < numSimultaneousTables; t++) {
        const matchPlayerNames = playingThisRoundNames.splice(0, numPlayersPerMatch);
        const matchPlayers = allParticipants.filter(p => matchPlayerNames.includes(p.name));
        
        const rowData = {
            matchId: 0,
            round: round.toString(),
            players: matchPlayers,
            byePlayers: byesThisRound,
            displayCells: [`${round}`, matchPlayerNames.join(', '), byesThisRound.join(', ') || '-', '']
        };
        this.groupedMatchTables[t].data.push(rowData);
      }
    }
    
    const finalMatchCount = totalRounds - (totalRounds * numByesPerRound / numActualParticipants);
    this.message = `全参加者の抜け番回数を完全に均等にするため、${totalRounds}回戦（1人あたり${finalMatchCount}試合）の対戦表を生成しました。`;
  }

  // --- Team Formation Methods ---
  initializeTeams(): void {
    // Keep the original participants list for non-admin view
    this.unassignedParticipants = this.participants.filter(p => !p.team);
    
    const teamsMap = new Map<string, any[]>();
    this.participants.filter(p => p.team).forEach(p => {
      if (!teamsMap.has(p.team)) {
        teamsMap.set(p.team, []);
      }
      teamsMap.get(p.team)?.push(p);
    });
    
    this.teams = Array.from(teamsMap.entries()).map(([name, participants]) => ({ name, participants }));
  }

  addTeam(): void {
    const existingTeamNumbers = this.teams
      .map(team => parseInt(team.name.replace('チーム', ''), 10))
      .filter(num => !isNaN(num));
    
    let newTeamNumber = 1;
    while (existingTeamNumbers.includes(newTeamNumber)) {
      newTeamNumber++;
    }
    
    this.teams.push({ name: `チーム${newTeamNumber}`, participants: [] });
  }

  removeTeam(teamName: string): void {
    const teamIndex = this.teams.findIndex(t => t.name === teamName);
    if (teamIndex > -1) {
      const removedTeam = this.teams.splice(teamIndex, 1)[0];
      this.unassignedParticipants.push(...removedTeam.participants);
    }
  }

  drop(event: CdkDragDrop<any[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  saveTeams(): void {
    const updateRequests: { userId: string, team: string | null }[] = [];
    this.unassignedParticipants.forEach(p => updateRequests.push({ userId: p.userId, team: null }));
    this.teams.forEach(team => {
      team.participants.forEach(p => updateRequests.push({ userId: p.userId, team: team.name }));
    });

    this.http.put(`${this.apiUrl}/${this.tournamentId}/teams`, updateRequests).subscribe({
      next: () => {
        this.message = 'チーム編成を保存しました。';
      },
      error: (err) => {
        console.error('Failed to save teams', err);
        this.message = 'チーム編成の保存に失敗しました。';
      }
    });
  }
  // --- End of Team Formation Methods ---

  saveResult(matchId: number): void {
    const scores = this.matchScores[matchId];
    if (!scores) {
      this.message = 'スコアが見つかりません。';
      return;
    }

    const playerScores = Object.keys(scores).map(userId => ({
      userId: userId,
      score: scores[userId] || 0
    }));

    const payload = {
      matchId: matchId,
      playerScores: playerScores
    };

    this.http.post(`${this.apiUrl}/matches/save-result`, payload).subscribe({
      next: () => {
        this.message = `対戦ID ${matchId} の結果を保存しました。`;
        this.calculatePlayerStats(); // Recalculate stats after saving a result
      },
      error: (err) => {
        console.error(err);
        this.message = '結果の保存に失敗しました。';
      }
    });
  }
}
