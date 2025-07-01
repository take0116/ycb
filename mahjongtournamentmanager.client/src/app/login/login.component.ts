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

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.authService.login(this.model.username, this.model.password).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.errorMessage = '';
        this.router.navigate(['/events']); // ログイン成功後、企画一覧へリダイレクト
      },
      error: (error) => {
        console.error('Login failed', error);
        if (error.error && error.error.Message) {
          this.errorMessage = error.error.Message;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }
}
