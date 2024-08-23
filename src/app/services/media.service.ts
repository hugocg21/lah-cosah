import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { map, mergeMap, finalize, catchError } from 'rxjs/operators';
import { Observable, forkJoin, from, of } from 'rxjs';
import { environment } from '../environments/environments';

export interface Media {
  id: number;
  name: string;
  url: string;
  selected?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private basePath = environment.firebaseConfig.storageBucket;

  constructor(private storage: AngularFireStorage) {}

  getFolders(): Observable<string[]> {
    return this.storage.ref(this.basePath).listAll().pipe(
      map((result) => result.prefixes.map((prefix) => prefix.fullPath.split('/').pop()!))
    );
  }

  getMediaByFolder(folder: string | null): Observable<Media[]> {
    const folderPath = folder ? `${this.basePath}/${folder}` : this.basePath;
    return this.storage.ref(folderPath).listAll().pipe(
      mergeMap((result) => {
        const mediaObservables = result.items.filter((item) => item.name !== '.keep').map((item) =>
          from(item.getDownloadURL()).pipe(
            map((url) => ({ id: -1, name: item.name, url: url, selected: false } as Media))
          )
        );
        return forkJoin(mediaObservables);
      })
    );
  }

  getTotalMediaCount(): Observable<number> {
    return this.storage.ref(this.basePath).listAll().pipe(
      mergeMap(result => {
        const folderObservables = result.prefixes.map(prefix => this.getMediaCountInFolder(prefix.fullPath));
        const rootMediaCount = result.items.filter(item => item.name !== '.keep').length;
        return forkJoin(folderObservables).pipe(
          map(folderCounts => folderCounts.reduce((acc, count) => acc + count, rootMediaCount))
        );
      })
    );
  }

  private getMediaCountInFolder(folderPath: string): Observable<number> {
    return this.storage.ref(folderPath).listAll().pipe(
      mergeMap(result => {
        const folderObservables = result.prefixes.map(prefix => this.getMediaCountInFolder(prefix.fullPath));
        const mediaCount = result.items.filter(item => item.name !== '.keep').length;
        return folderObservables.length > 0 ?
          forkJoin(folderObservables).pipe(
            map(counts => counts.reduce((acc, count) => acc + count, mediaCount))
          ) :
          of(mediaCount);
      })
    );
  }

  createFolder(folderName: string): Observable<void> {
    return from(this.storage.ref(`${this.basePath}/${folderName}/.keep`).putString('')).pipe(map(() => void 0));
  }

  renameFolder(oldFolderName: string, newFolderName: string): Observable<void> {
    const oldFolderPath = `${this.basePath}/${oldFolderName}`;
    const newFolderPath = `${this.basePath}/${newFolderName}`;

    return this.storage.ref(oldFolderPath).listAll().pipe(
      mergeMap(result => {
        const moveOps = result.items.map(item => {
          const newItemRef = this.storage.ref(`${newFolderPath}/${item.name}`);
          return from(item.getDownloadURL()).pipe(
            mergeMap(url => from(fetch(url).then(res => res.blob()))),
            mergeMap(blob => newItemRef.put(blob)),
            finalize(() => item.delete())
          );
        });

        // Copy .keep file to the new folder if exists
        const copyKeepFile = this.storage.ref(`${oldFolderPath}/.keep`).getDownloadURL().pipe(
          mergeMap(url => from(fetch(url).then(res => res.blob()))),
          mergeMap(blob => this.storage.ref(`${newFolderPath}/.keep`).put(blob)),
          catchError(() => of(null)) // Ignore errors if .keep file doesn't exist
        );

        return forkJoin([...moveOps, copyKeepFile]).pipe(
          finalize(() => {
            // Delete the old folder reference
            this.storage.ref(oldFolderPath).delete();
          })
        );
      }),
      map(() => void 0)
    );
  }

  uploadMedia(files: File[], folder: string | null): Observable<Media[]> {
    const folderPath = folder ? `${this.basePath}/${folder}` : this.basePath;
    const uploads = files.map((file) => {
      const filePath = `${folderPath}/${Date.now()}_${file.name}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);

      return task.snapshotChanges().pipe(
        finalize(() => fileRef.getDownloadURL()),
        mergeMap(() => fileRef.getDownloadURL()),
        map((url) => ({ id: -1, name: file.name, url }))
      );
    });

    return forkJoin(uploads);
  }

  deleteMedia(media: Media): Observable<void> {
    return from(this.storage.refFromURL(media.url).delete());
  }

  deleteFolder(folderName: string): Observable<void> {
    const folderRef = this.storage.ref(`${this.basePath}/${folderName}`);
    return folderRef.listAll().pipe(
      mergeMap((result) => {
        const deleteOps = result.items.map((item) => item.delete());
        return forkJoin(deleteOps).pipe(finalize(() => folderRef.delete()));
      }),
      map(() => void 0)
    );
  }

  moveMediaToFolder(media: Media, folder: string | null): Observable<void> {
    const newFilePath = folder ? `${this.basePath}/${folder}/${media.name}` : `${this.basePath}/${media.name}`;
    const newFileRef = this.storage.ref(newFilePath);
    return from(this.storage.refFromURL(media.url).getDownloadURL()).pipe(
      mergeMap((url) => from(fetch(url).then((res) => res.blob()))),
      mergeMap((blob) => newFileRef.put(blob)),
      finalize(() => from(this.storage.refFromURL(media.url).delete())),
      map(() => void 0)
    );
  }
}
