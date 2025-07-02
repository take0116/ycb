import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  model: any = { username: '', password: '' };
  errorMessage: string = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.authService.login(this.model.username, this.model.password).subscribe({
      next: (response) => {
        if (response) {
          this.router.navigate(['/events']);
        } else {
          this.errorMessage = 'ログインに失敗しました。';
        }
      },
      error: (error) => {
        console.error('Login failed', error);
        this.errorMessage = 'ログインに失敗しました。ユーザー名またはパスワードを確認してください。';
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}

