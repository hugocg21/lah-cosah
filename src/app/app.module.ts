import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';

import { LoginComponent } from './components/login/login.component';
import { MediaUploadComponent } from './components/media-upload/media-upload.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { HttpClientModule } from '@angular/common/http';
import { MediaModalComponent } from './components/media-modal/media-modal.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { environment } from './environments/environments';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MediaUploadComponent,
    GalleryComponent,
    MediaModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    FontAwesomeModule,
    DragDropModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireStorageModule,
  ],
  providers: [
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: "AIzaSyAI9SgpPzfpkxRmVItpRmRE_pEtIfw_mMg",
        authDomain: "lahcosahnuehtrah.firebaseapp.com",
        projectId: "lahcosahnuehtrah",
        storageBucket: "lahcosahnuehtrah.appspot.com",
        messagingSenderId: "12190056168",
        appId: "1:12190056168:web:4f20d3f75083c18a11135d",
        measurementId: "G-QJSMLBCF19"
      })
    ),
    provideAuth(() => getAuth()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
