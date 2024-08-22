import { Component } from '@angular/core';
import { MediaService } from '../../services/media.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-media-upload',
  templateUrl: './media-upload.component.html',
})
export class MediaUploadComponent {
  selectedFiles: File[] = [];
  folders: string[] = [];
  selectedFolder: string | null = null;

  constructor(private mediaService: MediaService, private router: Router) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.mediaService.getFolders().subscribe(
      ({ folders, fileCount }) => {  // Ajustar para recibir el objeto con carpetas y conteo de archivos
        this.folders = folders.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        console.log(`Total de archivos: ${fileCount}`); // Puedes manejar el conteo de archivos como necesites
      },
      (error) => {
        console.error('Error al obtener las carpetas:', error);
      }
    );
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files) as File[];
  }

  uploadFiles(): void {
    if (this.selectedFiles.length > 0) {
      this.mediaService.uploadMedia(this.selectedFiles, this.selectedFolder).subscribe(() => {
        alert('Archivos subidos con éxito');
        this.router.navigate(['/gallery']);
      },
      (error) => {
        console.error('Error al subir los archivos:', error);
        alert('Error al subir los archivos');
      });
    } else {
      alert('Por favor selecciona un archivo primero');
    }
  }
}
