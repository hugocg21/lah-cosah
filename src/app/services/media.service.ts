import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { catchError, delay, finalize, map, mergeMap } from 'rxjs/operators';
import { Observable, forkJoin, from, throwError } from 'rxjs';
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

  // Obtener lista de carpetas
  getFolders(): Observable<{ folders: string[]; fileCount: number }> {
    return this.storage
      .ref(this.basePath)
      .listAll()
      .pipe(
        map((result) => {
          // Extraer los nombres de las carpetas
          const folders = result.prefixes.map(
            (prefix) => prefix.fullPath.split('/').pop()!
          );

          // Contar los archivos filtrando el archivo .keep
          const fileCount = result.items.filter(
            (item) => item.name !== '.keep'
          ).length;

          return { folders, fileCount };
        })
      );
  }

  getMediaByFolder(
    folder: string | null
  ): Observable<{ media: Media[]; fileCount: number; totalFileCount: number }> {
    const folderPath = folder ? `${this.basePath}/${folder}` : this.basePath;

    // Obtener todos los archivos en la raíz para calcular el total
    return this.storage
      .ref(this.basePath)
      .listAll()
      .pipe(
        mergeMap((rootResult) => {
          const rootFileCount = rootResult.items.filter(
            (item) => item.name !== '.keep'
          ).length;

          return this.storage
            .ref(folderPath)
            .listAll()
            .pipe(
              mergeMap((result) => {
                const mediaObservables = result.items
                  .filter((item) => item.name !== '.keep')
                  .map((item) =>
                    from(item.getDownloadURL()).pipe(
                      map(
                        (url) =>
                          ({
                            id: -1,
                            name: item.name,
                            url: url,
                            selected: false,
                          } as Media)
                      )
                    )
                  );

                return forkJoin(mediaObservables).pipe(
                  map((media) => ({
                    media,
                    fileCount: media.length,
                    totalFileCount: rootFileCount, // Usar el conteo de archivos en la raíz como total
                  }))
                );
              })
            );
        })
      );
  }

  // Crear una nueva carpeta (esto en realidad no es necesario en Firebase ya que las carpetas se crean implícitamente al agregar archivos)
  createFolder(folderName: string): Observable<void> {
    return from(
      this.storage.ref(`${this.basePath}/${folderName}/.keep`).putString('')
    ).pipe(map(() => void 0));
  }

  // Subir archivos
  uploadMedia(files: File[], folder: string | null): Observable<Media[]> {
    const folderPath = folder ? `${this.basePath}/${folder}` : this.basePath;
    const uploads = files.map((file) => {
      const filePath = `${folderPath}/${Date.now()}_${file.name}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);

      return task.snapshotChanges().pipe(
        finalize(() => fileRef.getDownloadURL()), // Ensure upload is complete
        delay(5000), // Wait for 5 seconds before fetching the download URL
        mergeMap(() => fileRef.getDownloadURL()), // Fetch the download URL
        map((url) => ({ id: -1, name: file.name, url }))
      );
    });

    return forkJoin(uploads);
  }

  // Eliminar un archivo
  deleteMedia(media: Media): Observable<void> {
    return from(this.storage.refFromURL(media.url).delete());
  }

  // Eliminar carpeta (esto implica eliminar todos los archivos en ella)
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

  // Mover medios a otra carpeta (esto implica copiar y luego eliminar)
  moveMediaToFolder(media: Media, folder: string | null): Observable<void> {
    const newFilePath = folder
      ? `${this.basePath}/${folder}/${media.name}`
      : `${this.basePath}/${media.name}`;
    const newFileRef = this.storage.ref(newFilePath);
    return from(this.storage.refFromURL(media.url).getDownloadURL()).pipe(
      mergeMap((url) => from(fetch(url).then((res) => res.blob()))),
      mergeMap((blob) => newFileRef.put(blob)),
      finalize(() => from(this.storage.refFromURL(media.url).delete())),
      map(() => void 0)
    );
  }
}
