import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ChatFileService {
  constructor(private http: HttpClient) {}

  public sendFile(body: FormData): Observable<any> {
    return this.http.post<any>('http://localhost:8070/chat/upload/file', body);
  }

  public sendVoiceFile(body: FormData): Observable<any> {
    return this.http.post<any>('http://localhost:8070/chat/upload/voice/', body);
  }

  public deleteFile(fileName: string): Observable<any> {
    return this.http.delete(`http://localhost:8070/chat/delete/file/${fileName}`);
  }
}
