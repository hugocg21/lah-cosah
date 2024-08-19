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
    this.loading = true;

    this.authService.login(this.username, this.password).subscribe(
      () => {
        this.authService.setAuthHeaders(this.username, this.password);
        this.router.navigate(['/gallery']);
        this.loading = false;
      },
      error => {
        alert('Credenciales incorrectas');
        console.error('Error de autenticación:', error);
        this.loading = false;
      }
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
