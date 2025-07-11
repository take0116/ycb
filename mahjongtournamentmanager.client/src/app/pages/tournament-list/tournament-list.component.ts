import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TournamentListItem } from '../../models/tournament';
import { environment } from '../../../environments/environment';

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
        this.tournaments = this.sortTournaments(data);
        this.isLoading = false;
        // Trigger scroll-based animations after data loads
        setTimeout(() => this.initScrollAnimations(), 0);
      },
      error: err => {
        console.error(err);
        this.errorMessage = '一覧の取得に失敗しました。';
        this.isLoading = false;
      }
    });
  }

  private sortTournaments(tournaments: TournamentListItem[]): TournamentListItem[] {
    const statusOrder: { [key: number]: number } = {
      1: 1, // 募集中
      0: 2, // 企画中
      2: 3, // 募集終了
      3: 4  // 終了
    };

    return tournaments.sort((a, b) => {
      const statusA = statusOrder[a.status] || 99;
      const statusB = statusOrder[b.status] || 99;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateB - dateA;
    });
  }

  private initScrollAnimations(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-scroll', 'in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-scroll]').forEach(el => {
      observer.observe(el);
    });
  }
}
