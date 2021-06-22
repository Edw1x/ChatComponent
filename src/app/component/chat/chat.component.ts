import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../service/socket/socket.service';
import { ChatRoom } from '../../model/chat-room/chat-room.model';
import { ChatRoomService } from '../../service/chat-room/chat-room.service';
import { UserService } from '../../service/user/user.service';
import { User } from '../../model/user/user.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  public chatRooms: ChatRoom[];
  public currentUser: User;

  constructor(private socketService: SocketService, private chatRoomService: ChatRoomService, private userService: UserService) {}

  ngOnInit(): void {
    this.socketService.connect();
    this.getAllRooms();
    this.socketService.setCurrentUser(this.currentUser);
    this.socketService.setAllRooms(this.chatRooms);
  }

  private getAllRooms(): void {
    this.chatRoomService.getAllRooms().subscribe((data) => (this.chatRooms = data));
  }
}
