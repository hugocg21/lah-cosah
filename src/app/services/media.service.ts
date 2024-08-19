import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Media {
  id: number;
  name: string;
  url: string;
  selected?: boolean;
}

declare var process: {
  env: {
    ANGULAR_APP_BACKEND_URL: string;
  }
};

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private baseUrl = process.env['ANGULAR_APP_BACKEND_URL'];

  constructor(private http: HttpClient) {}

  testLogin(headers: HttpHeaders): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}`, { headers });
  }

  createFolder(folderName: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/create-folder`, folderName, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  getFolders(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/folders`);
  }

  getMediaByFolder(folder: string | null): Observable<Media[]> {
    const folderPath = folder || '';
    return this.http.get<Media[]>(`${this.baseUrl}?folder=${folderPath}`).pipe(
      map((media) =>
        media.map((m) => ({
          ...m,
          url: this.buildMediaUrl(folderPath, m.name),
        }))
      )
    );
  }

  private buildMediaUrl(folder: string, filename: string): string {
    const filePath = folder ? `${folder}/${filename}` : filename;
    return `${this.baseUrl}/serve?filename=${encodeURIComponent(filePath)}`;
  }

  uploadMedia(files: File[], folder: string | null): Observable<Media[]> {
    const formData: FormData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (folder) {
      formData.append('folder', folder);
    }
    const headers = this.getAuthHeaders();
    return this.http.post<Media[]>(
      `${this.baseUrl}/upload/multiple`,
      formData,
      { headers }
    );
  }

  deleteMedia(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers });
  }

  deleteMultipleMedia(ids: number[]): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.post<void>(`${this.baseUrl}/delete-multiple`, ids, {
      headers,
    });
  }

  deleteFolder(folderName: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.baseUrl}/delete-folder?folderName=${encodeURIComponent(folderName)}`, { headers });
  }

  moveMediaToFolder(mediaId: number, folder: string): Observable<void> {
    const folderToMove = folder || ''; // Convert null or undefined to an empty string
    return this.http.put<void>(`${this.baseUrl}/${mediaId}/move`, { folder: folderToMove }, { headers: this.getAuthHeaders() });
  }

  private getAuthHeaders(): HttpHeaders {
    const storedHeaders = localStorage.getItem('authHeaders');
    return storedHeaders
      ? new HttpHeaders(JSON.parse(storedHeaders))
      : new HttpHeaders();
  }
}
