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

  login(username: string, password: string): Observable<void> {
    const email = username === 'user' ? this.email : username;

    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(map(() => {
      this.afAuth.idToken.subscribe((token: string | null) => {
        if (token) {
          sessionStorage.setItem('authToken', token);
        }
      });
    }));
  }

  logout(): Observable<void> {
    return from(this.afAuth.signOut()).pipe(map(() => {
      sessionStorage.removeItem('authToken');
    }));
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('authToken');
  }

  getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
    return new HttpHeaders();
  }
}
