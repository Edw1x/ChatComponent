import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { ChatComponent } from './component/chat/chat.component';
import { HttpClientModule } from '@angular/common/http';
import { ChatMessagesComponent } from './component/chat-messages/chat-messages.component';
import { ChatRoomsComponent } from './component/chat-rooms/chat-rooms.component';
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ModalComponent } from './component/modal/modal.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';
import { authInterceptorProviders } from './service/interseptors/auth.interceptor';

@NgModule({
  declarations: [AppComponent, ChatComponent, ChatMessagesComponent, ChatRoomsComponent, ModalComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    MatDialogModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    NgbModule
  ],
  entryComponents: [ModalComponent],
  providers: [ChatRoomsComponent, CookieService, authInterceptorProviders],
  bootstrap: [AppComponent]
})
export class AppModule {}
