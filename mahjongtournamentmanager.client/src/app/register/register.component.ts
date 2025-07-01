import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  model: any = { username: '', password: '' };
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  register() {
    this.authService.register(this.model.username, this.model.password).pipe(
      switchMap(() => {
        console.log('Registration successful');
        return this.authService.login(this.model.username, this.model.password);
      })
    ).subscribe({
      next: () => {
        // ログイン成功後、AuthServiceがホームページにリダイレクトします
      },
      error: (error) => {
        console.error('Registration or login failed', error);
        // 登録またはログインに失敗した場合、エラーメッセージを表示し、ログインページにリダイレクトします
        this.errorMessage = '登録またはログインに失敗しました。';
        this.router.navigate(['/login']);
      }
    });
  }
}