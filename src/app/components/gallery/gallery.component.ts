import { Component, OnInit } from '@angular/core';
import { MediaService, Media } from '../../services/media.service';
import { faTrash, faFolder, faVideo, faImage } from '@fortawesome/free-solid-svg-icons';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
})
export class GalleryComponent implements OnInit {
  mediaList: Media[] = [];
  selectedMedia: Media | null = null;
  multiSelectMode: boolean = false;

  folders: string[] = [];
  currentFolder: string | null = null;
  newFolderName: string = '';

  isModalOpen: boolean = false;

  folderCount: number = 0; // Contador de carpetas
  fileCount: number = 0;   // Contador de archivos
  totalFileCount: number = 0

  faTrash = faTrash;
  faFolder = faFolder;
  faVideo = faVideo;
  faImage = faImage;

  constructor(private mediaService: MediaService) {}

  ngOnInit(): void {
    this.loadFolders();
    this.loadMedia();
  }

  loadFolders(): void {
    this.mediaService.getFolders().subscribe(
      ({ folders, fileCount }) => {
        this.folders = folders.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

        if (!this.currentFolder) {
          // Cargar imágenes de todas las carpetas si estás en la raíz
          this.loadMediaFromAllFolders();
          console.log(`Total de archivos en todas las carpetas: ${fileCount}`);
        } else {
          console.log(`Total de archivos en la carpeta actual: ${fileCount}`);
        }
      },
      (error) => {
        console.error('Error al obtener las carpetas:', error);
      }
    );
  }

  loadMedia(): void {
    const folder = this.currentFolder || '';
    this.mediaService.getMediaByFolder(folder).subscribe(
      (result) => {
        this.mediaList = result.media;
        this.fileCount = result.fileCount; // Actualizar contador de archivos
      },
      (error) => {
        console.error('Error al obtener los medios:', error);
      }
    );
  }

  loadMediaFromAllFolders(): void {
    this.mediaList = []; // Limpiar la lista de medios
    let totalFileCount = 0;

    this.folders.forEach(folder => {
      this.mediaService.getMediaByFolder(folder).subscribe(
        ({ media, fileCount }) => {
          this.mediaList = [...this.mediaList, ...media];
          totalFileCount += fileCount;
          console.log(`Total de archivos hasta ahora: ${totalFileCount}`);
        },
        (error) => {
          console.error('Error al obtener los medios de la carpeta:', error);
        }
      );
    });
  }


  createFolder(): void {
    if (this.newFolderName.trim()) {
      this.mediaService.createFolder(this.newFolderName).subscribe(
        () => {
          this.loadFolders();
          this.newFolderName = '';
        },
        (error) => {
          console.error('Error al crear la carpeta:', error);
        }
      );
    } else {
      alert('Por favor ingresa un nombre para la carpeta.');
    }
  }

  openFolder(folder: string) {
    this.currentFolder = folder;
    this.mediaList = []; // Limpiar la lista de medios antes de cargar nuevos
    this.loadMedia(); // Cargar medios en la carpeta
  }

  goBack() {
    this.currentFolder = null;
    this.mediaList = []; // Limpiar la lista de medios antes de cargar los medios de la raíz
    this.loadMedia(); // Cargar medios en la raíz
  }

  toggleMultiSelect(): void {
    this.multiSelectMode = !this.multiSelectMode;
    if (!this.multiSelectMode) {
      this.mediaList.forEach((media) => (media.selected = false));
    }
  }

  selectAllMedia(): void {
    const allSelected = this.mediaList.every((media) => media.selected);
    this.mediaList.forEach((media) => (media.selected = !allSelected));
  }

  openModal(media: Media): void {
    this.selectedMedia = media;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedMedia = null;
  }

  deleteMedia(media: Media): void {
    if (confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      this.mediaService.deleteMedia(media).subscribe(() => {
        this.mediaList = this.mediaList.filter((m) => m.url !== media.url);
        this.fileCount--; // Reducir el contador de archivos
        this.closeModal();
      });
    }
  }

  deleteFolder(folder: string): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la carpeta "${folder}" y todo su contenido?`)) {
      this.mediaService.deleteFolder(folder).subscribe(() => {
        this.folders = this.folders.filter((f) => f !== folder);
        this.folderCount--; // Reducir el contador de carpetas
        this.loadMedia();
      });
    }
  }

  deleteSelectedMedia(): void {
    const mediaToDelete = this.mediaList.filter((media) => media.selected);
    if (mediaToDelete.length > 0 && confirm('¿Estás seguro de que deseas eliminar los medios seleccionados?')) {
      const deleteOps = mediaToDelete.map((media) => this.mediaService.deleteMedia(media));
      forkJoin(deleteOps).subscribe(() => {
        this.mediaList = this.mediaList.filter((media) => !media.selected);
        this.fileCount -= mediaToDelete.length; // Reducir el contador de archivos
        this.toggleMultiSelect();
      });
    }
  }

  isVideo(url: string): boolean {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('.m4v');
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onDragStart(event: DragEvent, media: Media): void {
    event.dataTransfer?.setData('media', JSON.stringify(media));
  }

  onDrop(event: DragEvent, folder: string): void {
    event.preventDefault();
    const mediaData = event.dataTransfer?.getData('media');
    if (mediaData) {
      const media: Media = JSON.parse(mediaData);
      this.moveMediaToFolder(media, folder);
    }
  }

  onDropToRoot(event: DragEvent): void {
    event.preventDefault();
    const mediaData = event.dataTransfer?.getData('media');
    if (mediaData) {
      const media: Media = JSON.parse(mediaData);
      this.moveMediaToFolder(media, null);
    }
  }

  moveMediaToFolder(media: Media, folder: string | null): void {
    this.mediaService.moveMediaToFolder(media, folder).subscribe(() => {
      this.loadMedia();
      this.loadFolders();
    },
    (error) => {
      console.error('Error al mover el archivo:', error);
    });
  }
}
