import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { backendChatLink, participantLink } from '../../../links';
import { ChatRoom } from '../../model/chat-room/chat-room.model';
import { User } from 'src/app/model/user/user.model';

@Injectable({
  providedIn: 'root'
})

export class ChatRoomService {
  constructor(private http: HttpClient) {}

  public getAllRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${backendChatLink}`);
  }

  public getPrivateChatRoom(id: number): Observable<ChatRoom> {
    return this.http.get<ChatRoom>(`${participantLink}/${id}`);
  }

  public getGroupChatRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${backendChatLink}/groups`);
  }

  public createGroupChatRoom(list: User[], chatName: string): void {
    let ids = '';

    list.forEach((room) => (ids += room.id + ','));

    ids = ids.slice(0, -1);

    this.http.get(`${backendChatLink}/users/${ids}/room/${chatName}`).subscribe();
  }

  public getAllChatRoomsByQuery(name: string): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${backendChatLink}/rooms/${name}`);
  }

  public getAllVisibleRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${backendChatLink}/rooms/visible`);
  }
  public cleanUnreadMessages(userId: number, roomId: number): void {
    this.http.delete(`${backendChatLink}/room/${userId}/${roomId}`).subscribe();
  }
}
