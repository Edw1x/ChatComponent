import { Injectable, OnInit } from '@angular/core';

declare var SockJS;
declare var Stomp;
import { webSocketEndPointLink, webSocketLink } from '../../../links';
import { ChatMessage } from '../../model/chat-message/chat-message.model';
import { User } from '../../model/user/user.model';
import { ChatRoom } from '../../model/chat-room/chat-room.model';
import { ChatRoomService } from '../chat-room/chat-room.service';
import { MessageLike } from '../../model/chat-message/message-like.model';
import { GroupChatRoomCreate } from '../../model/chat-room/group-chat-room-create.model';
import { Subject } from 'rxjs';
import { UserService } from '../user/user.service';
import { LeaveChat } from 'src/app/model/chat-room/leave-chat.model';


// @ts-ignore
@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnInit{
  public webSocket: any;
  public stompClient: any;
  public chatRoom: ChatRoom;
  public currentUser: User;
  public chatRooms: ChatRoom[];
  public chatRooms$ = new Subject();


  //TODO: BREAKING WHEN MOVED TO ngOnInit
  constructor(private chatService: ChatRoomService, private userService: UserService) {
    this.chatService.getAllVisibleRooms().subscribe((data) => (this.chatRooms = data));
  }

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe((user) => (this.currentUser = user));
  }

  public connect(): void {
    this.webSocket = new SockJS(webSocketLink + webSocketEndPointLink);
    this.stompClient = Stomp.over(this.webSocket);
    this.stompClient.connect({}, this.onConnected, this.onError);
  }

  private onConnected() {
    if (this.currentUser) {
      this.chatRooms.forEach((chatRoom: ChatRoom) => {
        this.stompClient.subscribe(`/room/${chatRoom.id}/queue/messages`, this.onMessageReceived);
      });

      this.stompClient.subscribe(`/rooms/user/${this.currentUser.id}`, this.onRoomReceived);
    }
  }

  private onError(err: Error) {
    console.log(err);
  }

  private userExist(chatRoom: ChatRoom): void {
    if (this.ifCurrentUserExistInChatRoom(chatRoom)) {
      // Якщо є user тоді оновляємо або створюємо нову
      let updateRoomBool = false;
      // оновлення
      this.chatRooms.forEach((chRoom: ChatRoom, index: number) => {
        if (chRoom.id === chatRoom.id) {
          this.getAllRooms().splice(index, 1, chatRoom);
          updateRoomBool = true;
        }
      });

      if (!updateRoomBool) {
        this.chatRooms.push(chatRoom);
      }
    } else {
      // якщо юзера немає то його було видалено, видаляємо чат
      this.chatRooms.forEach((chRoom: ChatRoom, index: number) => {
        if (chRoom.id === chatRoom.id) {
          this.getAllRooms().splice(index, 1);
        }
      });
    }

    this.chatRooms$.next(this.chatRooms);
  }

  private leaveRoom(chatRoom: ChatRoom): void {
    this.getAllRooms().forEach((chRoom: ChatRoom, index: number) => {
      if (chRoom.id === chatRoom.id) {
        if (this.compareParticipantArrays(chRoom.participants, chatRoom.participants)) {
          this.getAllRooms().splice(index, 1, chatRoom);
        } else {
          this.getAllRooms().splice(index, 1);
        }
      }
    });

    this.chatRooms$.next(this.chatRooms);
  }

  private createRoom(chatRoom: ChatRoom): void {
    this.stompClient.subscribe(`/room/${chatRoom.id}/queue/messages`, this.onMessageReceived);
    this.getAllRooms().push(chatRoom);

    this.chatRooms$.next(this.chatRooms);
  }

  private deleteRoom(chatRoom: ChatRoom): void {
    this.getAllRooms().forEach((chRoom: ChatRoom, index: number) => {
      if (chRoom.id === chatRoom.id) {
        this.getAllRooms().splice(index, 1);
      }
    });

    this.chatRooms$.next(this.chatRooms);
  }

  private onRoomReceived(room: any) {
    const chatRoom = JSON.parse(room.body);

    if (room.headers.createRoom) {
      this.createRoom(chatRoom);
    } else if (room.headers.updateRoom) {
      this.userExist(chatRoom);
    } else if (room.headers.deleteRoom) {
      this.deleteRoom(chatRoom);
    } else if (room.headers.leaveRoom) {
      this.leaveRoom(chatRoom);
    } else {
      console.log('error');
    }
  }

  private messageDelete(chatMessage: any): void {
    this.getChatRoom().messages.forEach((allMessages: any, index: number) => {
      if (allMessages.id === chatMessage.id) {
        this.getChatRoom().messages.splice(index, 1);
      }
    });
  }

  private messageUpdate(chatMessage: any) {
    this.getChatRoom().messages.forEach((allMessages: any, index: number) => {
      if (allMessages.id === chatMessage.id) {
        this.getChatRoom().messages.splice(index, 1, chatMessage);
        return;
      }
    });
  }

  private findRoom(chatMessage: any): void {
    this.chatRooms.forEach((chatRoom: ChatRoom, index: number) => {
      if (chatRoom.id === chatMessage.roomId) {
        chatRoom.amountUnreadMessages = chatRoom.amountUnreadMessages + 1;
        this.chatRooms.splice(index, 1, chatRoom);
        this.chatRooms$.next(this.chatRooms);
      }
    });
  }

  private deleteUnreadMark(): void {
    this.chatService.cleanUnreadMessages(this.currentUser.id, this.getChatRoom().id);
    this.chatRoom.amountUnreadMessages = 0;
  }

  private addUnreadMark(chatMessage: any): void {
    this.chatRooms.forEach((chatRoom: ChatRoom, index: number) => {
      if (chatRoom.id === chatMessage.roomId) {
        chatRoom.amountUnreadMessages = chatRoom.amountUnreadMessages + 1;
        this.chatRooms.splice(index, 1, chatRoom);
        this.chatRooms$.next(this.chatRooms);
      }
    });
  }

  private roomOptions(chatMessage: any): void {
    if (this.chatRoom === undefined) {
      this.findRoom(chatMessage);
    } else if (this.chatRoom.id === chatMessage.roomId) {
      this.deleteUnreadMark();
    } else if (this.chatRoom.id !== chatMessage.roomId) {
      this.addUnreadMark(chatMessage);
    }
  }

  private onMessageReceived(msg: any) {
    const chatMsg = JSON.parse(msg.body);

    if (msg.headers.delete) {
      this.messageDelete(chatMsg);
    } else if (msg.headers.update) {
      this.messageUpdate(chatMsg);
    } else {
      this.roomOptions(chatMsg);

      if (this.getChatRoom().messages.length === 0) {
        this.getChatRoom().messages.push(chatMsg);
        return;
      }

      if (this.getChatRoom().messages[this.getChatRoom().messages.length - 1].id !== chatMsg.id) {
        this.getChatRoom().messages.push(chatMsg);
      }
    }
  }

  public sendMessage(chatMessage: ChatMessage) {
    let ind = 0;
    this.chatService.getAllVisibleRooms().subscribe((data) => (this.chatRooms = data));
    const len = this.chatRooms.length;

    this.chatRooms.forEach((chatRoom: ChatRoom) => {
      if (chatRoom.id !== this.getChatRoom().id) {
        ind++;
      }
    });

    if (len === ind) {
      this.stompClient.subscribe(`/room/${this.getChatRoom().id}/queue/messages`, this.onMessageReceived);
    }

    this.stompClient.send('/app/chat', {}, JSON.stringify(chatMessage));
  }

  public deleteMessage(chatMessage: ChatMessage) {
    this.stompClient.send('/app/chat/delete', {}, JSON.stringify(chatMessage));
  }

  public updateMessage(chatMessage: ChatMessage) {
    this.stompClient.send('/app/chat/update', {}, JSON.stringify(chatMessage));
  }

  public closeWebSocket(): void {
    this.webSocket.close();
  }

  public setCurrentUser(currentUser: User): void {
    this.currentUser = currentUser;
  }

  public setChatRoom(chatRoom: ChatRoom): void {
    this.chatRoom = chatRoom;
  }

  public getChatRoom(): ChatRoom {
    return this.chatRoom;
  }

  public setAllRooms(chatRooms: ChatRoom[]): void {
    this.chatRooms = chatRooms;
  }

  public getAllRooms(): ChatRoom[] {
    return this.chatRooms;
  }

  public likeMessage(messageLike: MessageLike) {
    this.stompClient.send('/app/chat/like', {}, JSON.stringify(messageLike));
  }

  public createNewChatRoom(groupChatRoomCreate: GroupChatRoomCreate) {
    this.stompClient.send('/app/chat/users/create-room', {}, JSON.stringify(groupChatRoomCreate));
  }

  public updateChatRoom(room: ChatRoom) {
    this.stompClient.send('/app/chat/users/update-room', {}, JSON.stringify(room));
  }

  public deleteParticipantChatRoom(room: ChatRoom) {
    this.stompClient.send('/app/chat/users/delete-participants-room', {}, JSON.stringify(room));
  }

  public deleteChatRoom(room: ChatRoom) {
    this.stompClient.send('/app/chat/users/delete-room', {}, JSON.stringify(room));
  }

  public leaveChatRoom(leaveChat: LeaveChat) {
    this.stompClient.send('/app/chat/users/leave-room', {}, JSON.stringify(leaveChat));
  }

  private compareParticipantArrays(currentList: User[], newList: User[]): boolean {
    newList.forEach((user: User) => {
      if (!currentList.includes(user)) {
        return false;
      }
    });

    return true;
  }

  private ifCurrentUserExistInChatRoom(chatRoom: ChatRoom): boolean {
    let userExist = false;
    chatRoom.participants.forEach((participant: User) => {
      if (participant.id === this.currentUser.id) {
        userExist = true;
      }
    });

    return userExist;
  }
}
