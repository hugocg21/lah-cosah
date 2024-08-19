import { Component, OnInit } from '@angular/core';
import { MediaService } from '../../services/media.service';
import {
  faTrash,
  faFolder,
  faVideo,
  faImage,
} from '@fortawesome/free-solid-svg-icons';

export interface Media {
  id: number;
  name: string;
  url: string;
  selected?: boolean;
}

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
      (folders: string[]) => {
        this.folders = folders;
      },
      (error) => {
        console.error('Error al obtener las carpetas:', error);
      }
    );
  }

  loadMedia(): void {
    const folder = this.currentFolder || ''; // Use an empty string for the root
    this.mediaService.getMediaByFolder(folder).subscribe(
      (media: Media[]) => {
        this.mediaList = media;
      },
      (error) => {
        console.error('Error al obtener los medios:', error);
      }
    );
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

  openFolder(folder: string): void {
    this.currentFolder = folder;
    this.loadMedia();
  }

  goBack(): void {
    this.currentFolder = null;
    this.loadMedia();
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

  deleteMedia(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      this.mediaService.deleteMedia(id).subscribe(() => {
        this.mediaList = this.mediaList.filter((media) => media.id !== id);
        this.closeModal();
      });
    }
  }

  deleteFolder(folder: string): void {
    if (
      confirm(
        `¿Estás seguro de que deseas eliminar la carpeta "${folder}" y todo su contenido?`
      )
    ) {
      this.mediaService.deleteFolder(folder).subscribe(() => {
        this.folders = this.folders.filter((f) => f !== folder);
        this.loadMedia(); // Recargar medios por si estaban en la carpeta eliminada
      });
    }
  }

  deleteSelectedMedia(): void {
    const idsToDelete = this.mediaList
      .filter((media) => media.selected)
      .map((media) => media.id);
    if (
      idsToDelete.length > 0 &&
      confirm('¿Estás seguro de que deseas eliminar los medios seleccionados?')
    ) {
      this.mediaService.deleteMultipleMedia(idsToDelete).subscribe(() => {
        this.mediaList = this.mediaList.filter(
          (media) => !idsToDelete.includes(media.id)
        );
        this.toggleMultiSelect();
      });
    }
  }

  isVideo(url: string): boolean {
    return (
      url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg')
    );
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
      this.loadMedia();
      this.loadFolders();
    }
  }

  moveMediaToFolder(media: Media, folder: string | null): void {
    const folderToMove = folder || ''; // Convert null to an empty string
    this.mediaService.moveMediaToFolder(media.id, folderToMove).subscribe(
      () => {
        if (this.currentFolder === null) {
          // If we are in the root, reload the media list
          this.loadMedia();
        } else {
          // If we moved the file to the root, manually add it to the root media list
          if (folder === null) {
            this.mediaService.getMediaByFolder(null).subscribe(
              (rootMedia: Media[]) => {
                this.mediaList = rootMedia;
              },
              (error) => {
                console.error('Error al obtener los medios de la raíz:', error);
              }
            );
          }

          // Reload the current folder's media list
          this.loadMedia();
        }
        this.loadFolders(); // Refresh folders as well
      },
      (error) => {
        console.error('Error al mover el archivo:', error);
      }
    );
  }
}
