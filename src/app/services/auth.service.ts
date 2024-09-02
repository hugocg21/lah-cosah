import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { from, map, Observable, BehaviorSubject } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly email = 'user@example.com';
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(private afAuth: AngularFireAuth) {
    const token = sessionStorage.getItem('authToken');
    this.loggedIn.next(!!token);
  }

  login(username: string, password: string): Observable<void> {
    const email = username === 'user' ? this.email : username;

    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      map(() => {
        this.afAuth.idToken.subscribe((token: string | null) => {
          if (token) {
            sessionStorage.setItem('authToken', token);
            this.loggedIn.next(true); // Cambia el estado de autenticación
          }
        });
      })
    );
  }

  logout(): Observable<void> {
    return from(this.afAuth.signOut()).pipe(
      map(() => {
        sessionStorage.removeItem('authToken');
        this.loggedIn.next(false); // Cambia el estado de autenticación
      })
    );
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('authToken');
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
    return new HttpHeaders();
  }
}
