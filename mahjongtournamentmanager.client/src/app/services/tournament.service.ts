import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tournament } from '../models/tournament';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private apiUrl = `${environment.apiUrl}/api/tournaments`;

  constructor(private http: HttpClient) { }

  getTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(this.apiUrl);
  }

  getTournament(id: number): Observable<Tournament> {
    return this.http.get<Tournament>(`${this.apiUrl}/${id}`);
  }

  addTournament(tournament: Tournament): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl, tournament);
  }

  updateTournament(tournament: Tournament): Observable<any> {
    return this.http.put(`${this.apiUrl}/${tournament.id}`, tournament);
  }

  deleteTournament(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
