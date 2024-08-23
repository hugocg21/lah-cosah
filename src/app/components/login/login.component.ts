import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  loading: boolean = false;
  showPassword: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  login() {
    this.authService.login(this.username, this.password).subscribe(
      () => {
        this.router.navigate(['/gallery']);
      },
      (error) => {
        console.error('Error during login:', error);
        alert('Login failed');
      }
    );
  }


  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
