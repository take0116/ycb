import { Component } from '@angular/core';import { FormsModule } from '@angular/forms';import { CommonModule } from '@angular/common';import { AuthService } from '../auth.service';import { Router } from '@angular/router';@Component({  selector: 'app-register',  standalone: true,  imports: [FormsModule, CommonModule],  templateUrl: './register.component.html',  styleUrls: ['./register.component.css']})export class RegisterComponent {  model: any = { username: '', password: '' };  errorMessage: string = '';  constructor(private authService: AuthService, private router: Router) { }  register() {
    this.authService.register(this.model).subscribe(() => {
      console.log('Registration successful');
      // 登録後、自動的にログイン
      this.authService.login({ username: this.model.username, password: this.model.password }).subscribe(() => {
        // ログイン成功後、AuthServiceがホームページにリダイレクトします
      }, loginError => {
        console.error('Login failed after registration', loginError);
        // ログインに失敗した場合は、ログインページにリダイレクトします
        this.router.navigate(['/login']);
      });
    }, error => {
      console.error('Registration failed', error);
    });
  }}