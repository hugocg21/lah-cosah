import { Component, OnInit } from '@angular/core';
import { faBell, faTimes } from '@fortawesome/free-solid-svg-icons';
import { UploadHistoryItem, UploadHistoryService } from '../../services/upload-history.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-upload-history',
  templateUrl: './upload-history.component.html',
})
export class UploadHistoryComponent implements OnInit {
  history: UploadHistoryItem[] = [];
  isOpen = false;
  isLoggedIn = false;
  faBell = faBell;
  faTimes = faTimes;

  constructor(private uploadHistoryService: UploadHistoryService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      if (this.isLoggedIn) {
        this.uploadHistoryService.getHistory().subscribe((history) => {
          this.history = history;
        });
      }
    });
  }

  toggleDropdown() {
    if (this.isLoggedIn) {
      this.isOpen = !this.isOpen;
    }
  }

  removeItem(item: UploadHistoryItem) {
    this.uploadHistoryService.removeFromHistory(item);
  }
}
