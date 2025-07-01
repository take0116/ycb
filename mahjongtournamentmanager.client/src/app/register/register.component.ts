import { Component } from '@angular/core';import { FormsModule } from '@angular/forms';import { CommonModule } from '@angular/common';import { AuthService } from '../auth.service';import { Router } from '@angular/router';@Component({  selector: 'app-register',  standalone: true,  imports: [FormsModule, CommonModule],  templateUrl: './register.component.html',  styleUrls: ['./register.component.css']})export class RegisterComponent {  model: any = { username: '', password: '' };  errorMessage: string = '';  constructor(private authService: AuthService, private router: Router) { }  register() {    this.authService.register(this.model.username, this.model.password).subscribe({      next: (response) => {        console.log('Registration successful', response);        this.errorMessage = '';        // 登録成功後、自動的にログインして大会一覧へリダイレクト
        this.authService.login(this.model.username, this.model.password).subscribe({
          next: () => {
            this.router.navigate(['/events']);
          },
          error: (loginError) => {
            console.error('Auto-login failed after registration', loginError);
            this.errorMessage = '登録は成功しましたが、自動ログインに失敗しました。手動でログインしてください。';
          }
        });      },      error: (error) => {        console.error('Registration failed', error);        if (error.error && typeof error.error === 'object') {          this.errorMessage = Object.values(error.error).join('\n');        } else {          this.errorMessage = 'Registration failed. Please try again.';        }      }    });  }}