import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.backendUrl + '/api/media';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<void> {
    const headers = new HttpHeaders({
      Authorization: 'Basic ' + btoa(username + ':' + password),
    });

    return this.http.get<void>(`${this.baseUrl}`, { headers });
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('authHeaders');
  }

  logout(): void {
    sessionStorage.removeItem('authHeaders');
  }

  setAuthHeaders(username: string, password: string): void {
    sessionStorage.setItem('authHeaders', JSON.stringify({
      'Authorization': 'Basic ' + btoa(username + ':' + password)
    }));
  }

  getAuthHeaders(): HttpHeaders {
    const storedHeaders = sessionStorage.getItem('authHeaders');
    console.log('Encabezados de autenticación:', storedHeaders);
    return storedHeaders ? new HttpHeaders(JSON.parse(storedHeaders)) : new HttpHeaders();
  }
}
