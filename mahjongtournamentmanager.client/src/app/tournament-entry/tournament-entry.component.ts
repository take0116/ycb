import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tournament-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tournament-entry.component.html',
  styleUrl: './tournament-entry.component.css'
})
export class TournamentEntryComponent implements OnInit {
  tournamentId: string | null = null;
  entryForm: FormGroup;

  constructor(private route: ActivatedRoute, private http: HttpClient) {
    this.entryForm = new FormGroup({
      comment: new FormControl('')
    });
  }

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.paramMap.get('id');
  }

  onSubmit(): void {
    if (this.entryForm.valid && this.tournamentId) {
      const entryData = { comment: this.entryForm.value.comment };
      this.http.post(`/api/tournaments/${this.tournamentId}/entry`, entryData)
        .subscribe({
          next: () => {
            console.log('Entry successful!');
            alert('大会へのエントリーが完了しました！');
            // エントリー成功後のリダイレクトなど
          },
          error: (err) => {
            console.error('Entry failed:', err);
            alert('エントリーに失敗しました。\n' + err.message);
          }
        });
    }
  }
}