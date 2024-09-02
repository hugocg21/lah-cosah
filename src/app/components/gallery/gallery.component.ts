import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { MediaService, Media } from '../../services/media.service';
import {
  faTrash,
  faFolder,
  faVideo,
  faImage,
  faTimes,
  faCheckDouble,
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
  faLevelUpAlt,
  faEdit,
  faUpload,
  faSearch,
  faFileUpload,
  faThLarge,
  faList,
  faCheckSquare
} from '@fortawesome/free-solid-svg-icons';
import { forkJoin } from 'rxjs';
import { UploadHistoryService } from '../../services/upload-history.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
})
export class GalleryComponent implements OnInit, AfterViewChecked, AfterViewInit {
  @ViewChildren('videoRef') videos!: QueryList<ElementRef<HTMLVideoElement>>;

  mediaList: Media[] = [];
  selectedMedia: Media | null = null;
  multiSelectMode: boolean = false;

  folders: string[] = [];
  filteredFolders: string[] = [];
  currentFolder: string | null = null;
  newFolderName: string = '';
  folderToRename: string | null = null;
  selectedFiles: File[] = [];
  selectedFolder: string | null = null;

  isModalOpen: boolean = false;
  isCreateFolderModalOpen: boolean = false;
  isRenameFolderModalOpen: boolean = false;
  isUploadFilesModalOpen: boolean = false;

  hasFiles: boolean = false;

  faTrash = faTrash;
  faFolder = faFolder;
  faVideo = faVideo;
  faImage = faImage;
  faTimes = faTimes;
  faCheckDouble = faCheckDouble;
  faArrowLeft = faArrowLeft;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faLevelUpAlt = faLevelUpAlt;
  faEdit = faEdit;
  faUpload = faUpload;
  faSearch = faSearch;
  faFileUpload = faFileUpload;
  faThLarge = faThLarge;
  faList = faList;
  faCheckSquare = faCheckSquare;

  totalMediaCount: number = 0;
  currentFolderMediaCount: number = 0;
  searchTerm: string = '';

  viewMode: 'list' | 'grid' = 'grid';

  constructor(private mediaService: MediaService, private uploadHistoryService: UploadHistoryService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe((loggedIn) => {
      if (loggedIn) {
        this.loadFolders();

        const savedFolder = localStorage.getItem('currentFolder');
        if (savedFolder) {
          this.currentFolder = savedFolder;
          this.loadMedia();
        } else {
          this.loadMedia();
        }

        this.calculateTotalMediaCount();
      } else {

        console.error('Usuario no autenticado');
      }
    });
  }

  ngAfterViewInit(): void {
    this.ensureVideosAreMuted();
  }

  ngAfterViewChecked(): void {
    this.ensureVideosAreMuted();
  }

  ensureVideosAreMuted(): void {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.muted = true;
    });
  }

  loadFolders(): void {
    this.mediaService.getFolders().subscribe(
      (folders: string[]) => {
        this.folders = folders.sort((a, b) =>
          a.toLowerCase().localeCompare(b.toLowerCase())
        );
        this.filteredFolders = this.folders;
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

  loadMedia(): void {
    const folder = this.currentFolder || '';
    this.mediaService.getMediaByFolder(folder).subscribe(
      (media: Media[]) => {
        this.mediaList = media;
        this.currentFolderMediaCount = media.length;
        this.hasFiles = media.length > 0;
      },
      (error) => {
        console.error('Error al obtener los medios:', error);
      }
    );
  }

  calculateTotalMediaCount(): void {
    this.mediaService.getTotalMediaCount().subscribe(
      (totalCount) => {
        this.totalMediaCount = totalCount;
      },
      (error) => {
        console.error('Error al calcular el total de archivos:', error);
      }
    );
  }

  createFolder(): void {
    if (this.newFolderName.trim()) {
      this.mediaService.createFolder(this.newFolderName).subscribe(
        () => {
          this.loadFolders();
          this.newFolderName = '';
          this.calculateTotalMediaCount();
          this.closeCreateFolderModal();
        },
        (error) => {
          console.error('Error al crear la carpeta:', error);
        }
      );
    } else {
      alert('Por favor ingresa un nombre para la carpeta.');
    }
  }

  renameFolder(): void {
    if (this.newFolderName.trim() && this.folderToRename) {
      this.mediaService.renameFolder(this.folderToRename, this.newFolderName).subscribe(
        () => {
          this.loadFolders();
          this.newFolderName = '';
          this.folderToRename = null;
          this.closeRenameFolderModal();
        },
        (error) => {
          console.error('Error al renombrar la carpeta:', error);
        }
      );
    } else {
      alert('Por favor ingresa un nuevo nombre para la carpeta.');
    }
  }

  openFolder(folder: string): void {
    this.currentFolder = folder;
    localStorage.setItem('currentFolder', folder);
    this.mediaList = [];
    this.hasFiles = false;
    this.currentFolderMediaCount = 0;
    this.loadMedia();
  }

  goBack(): void {
    this.currentFolder = null;
    localStorage.removeItem('currentFolder');
    this.mediaList = [];
    this.hasFiles = false;
    this.currentFolderMediaCount = 0;
    this.loadMedia();
  }

  toggleMultiSelect(): void {
    this.multiSelectMode = !this.multiSelectMode;
    if (!this.multiSelectMode) {
      this.mediaList.forEach((media) => (media.selected = false));
    }
  }

  openCreateFolderModal(): void {
    this.isCreateFolderModalOpen = true;
  }

  closeCreateFolderModal(): void {
    this.isCreateFolderModalOpen = false;
  }

  openRenameFolderModal(folder: string): void {
    this.folderToRename = folder;
    this.newFolderName = folder;
    this.isRenameFolderModalOpen = true;
  }

  closeRenameFolderModal(): void {
    this.isRenameFolderModalOpen = false;
    this.newFolderName = '';
    this.folderToRename = null;
  }

  openUploadFilesModal(): void {
    if (this.currentFolder) {
      this.selectedFolder = this.currentFolder;
    } else {
      this.selectedFolder = null;
    }
    this.isUploadFilesModalOpen = true;
  }

  closeUploadFilesModal(): void {
    this.isUploadFilesModalOpen = false;
    this.selectedFiles = [];
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files) as File[];
  }



















  uploadFiles(): void {
    if (this.selectedFiles.length > 0) {
      this.mediaService.uploadMedia(this.selectedFiles, this.selectedFolder).subscribe(
        (uploadedMedia) => {
          uploadedMedia.forEach(media => {
            this.uploadHistoryService.addToHistory({
              folder: this.selectedFolder || 'Raíz',
              fileName: media.name,
              date: new Date()
            });
          });
          alert('Archivos subidos con éxito');
          this.closeUploadFilesModal();
          this.loadMedia();
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

  openModal(media: Media, videoElement: HTMLVideoElement | null): void {
    this.selectedMedia = media;
    this.isModalOpen = true;

    this.videos.forEach((video) => {
      if (video.nativeElement !== videoElement) {
        video.nativeElement.pause();
      }
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedMedia = null;

    this.videos.forEach((video) => {
      video.nativeElement.play();
    });
  }

  navigateNext(): void {
    if (this.selectedMedia) {
      const currentIndex = this.mediaList.indexOf(this.selectedMedia);
      const nextIndex = (currentIndex + 1) % this.mediaList.length;
      this.selectedMedia = this.mediaList[nextIndex];
    }
  }

  navigatePrevious(): void {
    if (this.selectedMedia) {
      const currentIndex = this.mediaList.indexOf(this.selectedMedia);
      const previousIndex =
        (currentIndex - 1 + this.mediaList.length) % this.mediaList.length;
      this.selectedMedia = this.mediaList[previousIndex];
    }
  }

  deleteMedia(media: Media): void {
    if (confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      this.mediaService.deleteMedia(media).subscribe(() => {
        this.mediaList = this.mediaList.filter((m) => m.url !== media.url);
        this.closeModal();
        this.calculateTotalMediaCount();
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
        this.loadMedia();
        this.calculateTotalMediaCount();
      });
    }
  }

  deleteSelectedMedia(): void {
    const mediaToDelete = this.mediaList.filter((media) => media.selected);
    if (
      mediaToDelete.length > 0 &&
      confirm('¿Estás seguro de que deseas eliminar los medios seleccionados?')
    ) {
      const deleteOps = mediaToDelete.map((media) =>
        this.mediaService.deleteMedia(media)
      );
      forkJoin(deleteOps).subscribe(() => {
        this.mediaList = this.mediaList.filter((media) => !media.selected);
        this.toggleMultiSelect();
        this.calculateTotalMediaCount();
      });
    }
  }

  isVideo(url: string): boolean {
    return (
      url.includes('.mp4') ||
      url.includes('.webm') ||
      url.includes('.ogg') ||
      url.includes('.m4v')
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
    this.mediaService.moveMediaToFolder(media, folder).subscribe(
      () => {
        this.loadMedia();
        this.loadFolders();
        this.calculateTotalMediaCount();
      },
      (error) => {
        console.error('Error al mover el archivo:', error);
      }
    );
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  selectAllMedia(): void {
    const allSelected = this.mediaList.every((media) => media.selected);
    this.mediaList.forEach((media) => (media.selected = !allSelected));
  }
}
