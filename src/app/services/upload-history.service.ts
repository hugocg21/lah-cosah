import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UploadHistoryItem {
  folder: string;
  fileName: string;
  date: Date;
}

@Injectable({
  providedIn: 'root',
})
export class UploadHistoryService {
  private uploadHistory: UploadHistoryItem[] = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
  private uploadHistorySubject = new BehaviorSubject<UploadHistoryItem[]>(this.uploadHistory);

  getHistory(): Observable<UploadHistoryItem[]> {
    return this.uploadHistorySubject.asObservable();
  }

  addToHistory(item: UploadHistoryItem) {
    this.uploadHistory.unshift(item);
    if (this.uploadHistory.length > 10) {
      this.uploadHistory.pop();
    }
    this.saveHistory();
  }

  removeFromHistory(item: UploadHistoryItem) {
    this.uploadHistory = this.uploadHistory.filter((i) => i !== item);
    this.saveHistory();
  }

  clearHistory() {
    this.uploadHistory = [];
    this.saveHistory();
  }

  private saveHistory() {
    localStorage.setItem('uploadHistory', JSON.stringify(this.uploadHistory));
    this.uploadHistorySubject.next(this.uploadHistory);
  }
}
