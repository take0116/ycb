import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  model: any = { username: '', password: '' };
  errorMessage: string = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) { }

  register() {
    this.authService.register(this.model.username, this.model.password)
      .subscribe({
        next: () => {
          // Registration successful, now log in to get the token
          this.authService.login(this.model.username, this.model.password).subscribe({
            next: (loginResponse) => {
              if (loginResponse) {
                this.router.navigate(['/events']);
              } else {
                // This case should ideally not happen if registration succeeds
                this.errorMessage = '登録後の自動ログインに失敗しました。手動でログインしてください。';
                this.router.navigate(['/login']);
              }
            },
            error: (loginError) => {
              console.error('Auto-login after registration failed', loginError);
              this.errorMessage = '登録後の自動ログインに失敗しました。手動でログインしてください。';
              this.router.navigate(['/login']);
            }
          });
        },
        error: (err) => {
          console.error('Registration failed', err);
          if (err.status === 400 && err.error) {
            // Flatten all error messages from the ModelState object
            const errorMessages = Object.values(err.error).flat().join(' ');
            
            // Check for the default Identity error message for duplicate username
            if (errorMessages.includes('is already taken') || errorMessages.includes('既に使用されています')) {
              this.errorMessage = 'このユーザー名は既に使用されています。';
            } else {
              this.errorMessage = `登録に失敗しました: ${errorMessages}`;
            }
          } else {
            this.errorMessage = '不明なエラーが発生しました。';
          }
        }
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
