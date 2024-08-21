import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { from, map, Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly email = 'user@example.com';

  constructor(private afAuth: AngularFireAuth) {}

  // Método para iniciar sesión, permitiendo que el usuario ingrese solo "user"
  login(username: string, password: string): Observable<void> {
    const email = username === 'user' ? this.email : username;

    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      map(() => {
        // Guardar token de autenticación en sessionStorage
        this.afAuth.idToken.subscribe((token: string | null) => {
          if (token) {
            sessionStorage.setItem('authToken', token);
          }
        });
      })
    );
  }

  // Método para cerrar sesión
  logout(): Observable<void> {
    return from(this.afAuth.signOut()).pipe(
      map(() => {
        sessionStorage.removeItem('authToken');
      })
    );
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('authToken');
  }

  // Método para obtener los encabezados de autenticación
  logout(): void {
    sessionStorage.removeItem('authHeaders');
  }

  setAuthHeaders(username: string, password: string): void {
    sessionStorage.setItem('authHeaders', JSON.stringify({
      'Authorization': 'Basic ' + btoa(username + ':' + password)
    }));
  }

  getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    }
    return new HttpHeaders();
  }
}
