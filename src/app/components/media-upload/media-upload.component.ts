import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../services/media.service';
import { Router } from '@angular/router';
import { faUpload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-media-upload',
  templateUrl: './media-upload.component.html',
})
export class MediaUploadComponent implements OnInit {
  selectedFiles: File[] = [];
  folders: string[] = [];
  filteredFolders: string[] = [];
  selectedFolder: string | null = null;
  searchTerm: string = '';

  faUpload = faUpload;

  constructor(private mediaService: MediaService, private router: Router) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.mediaService.getFolders().subscribe(
      (folders: string[]) => {
        this.folders = folders;
        this.filteredFolders = folders;
      },
      (error) => {
        console.error('Error al obtener las carpetas:', error);
      }
    );
  }

  filterFolders(): void {
    if (this.searchTerm) {
      this.filteredFolders = this.folders.filter((folder) =>
        folder.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredFolders = [...this.folders];
    }
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files) as File[];
  }

  uploadFiles(): void {
    if (this.selectedFiles.length > 0) {
      this.mediaService.uploadMedia(this.selectedFiles, this.selectedFolder).subscribe(
        () => {
          alert('Archivos subidos con éxito');
          this.router.navigate(['/gallery']);
        },
        (error) => {
          console.error('Error al subir los archivos:', error);
          alert('Error al subir los archivos');
        }
      );
    } else {
      alert('Por favor selecciona un archivo primero');
    }
  }
}
