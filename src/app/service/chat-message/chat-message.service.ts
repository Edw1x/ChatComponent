import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { backendChatLink } from '../../../links';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ChatMessageService {
  constructor(private http: HttpClient) {}

  public deleteMessage(messageId: number): void {
    this.http.get(`${backendChatLink}/message/${messageId}/delete`);
  }

  public updateMessage(messageId: number, content: string): void {
    this.http.put(`${backendChatLink}/message/${messageId}/update`, content, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      responseType: 'blob'
    });
  }

  public getLastMessageId(): Observable<number> {
    return this.http.get<number>(`${backendChatLink}/last/message`);
  }
}
