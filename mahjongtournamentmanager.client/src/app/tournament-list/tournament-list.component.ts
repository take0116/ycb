import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { TournamentListItem } from '../tournament';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tournament-list',
  templateUrl: './tournament-list.component.html',
  styleUrls: ['./tournament-list.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class TournamentListComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/api/TournamentSettings`;
  tournaments: TournamentListItem[] = [];
  isAdmin: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private http: HttpClient, private authService: AuthService) { }

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('Admin');
    this.http.get<TournamentListItem[]>(this.apiUrl).subscribe({
      next: data => {
        this.tournaments = data;
        this.isLoading = false;
      },
      error: err => {
        console.error(err);
        this.errorMessage = '一覧の取得に失敗しました。';
        this.isLoading = false;
      }
    });
  }

  getAccentColor(index: number): string {
    const colors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58'];
    return colors[index % colors.length];
  }
}
