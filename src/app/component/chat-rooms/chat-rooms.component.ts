import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { User } from '../../model/user/user.model';
import { UserService } from '../../service/user/user.service';
import { ChatRoomService } from '../../service/chat-room/chat-room.service';
import { ChatRoom } from '../../model/chat-room/chat-room.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ModalComponent } from '../modal/modal.component';
import { FormControl } from '@angular/forms';
import { SocketService } from '../../service/socket/socket.service';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GroupChatRoomCreate } from '../../model/chat-room/group-chat-room-create.model';
import { LeaveChat } from '../../model/chat-room/leave-chat.model';

@Component({
  selector: 'app-chat-rooms',
  templateUrl: './chat-rooms.component.html',
  styleUrls: ['./chat-rooms.component.scss']
})
export class ChatRoomsComponent implements OnInit {
  public currentUser: User;
  public chatRooms: ChatRoom[] = [];
  public closeResult: any;
  public model = {
    chatName: ''
  };
  public queryField: FormControl = new FormControl();
  public list: any;
  public allParticipants: Array<User>;
  public privateChatRoom: ChatRoom;
  public currentClickedRoom: ChatRoom;
  public groupChats: ChatRoom[];
  public chatRoomRef: MatDialogRef<ModalComponent>;
  public chatRoom: GroupChatRoomCreate;
  public leaveChat: LeaveChat;

  constructor(
    private userService: UserService,
    private chatRoomService: ChatRoomService,
    private dialog: MatDialog,
    private socketService: SocketService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.chatRoom = {
      usersId: [],
      chatName: '',
      ownerId: 0
    };

    this.list = [];
    this.getAllRooms();
    this.getCurrentUser();
    this.getAllParticipants();
    this.getGroupsChatRooms();
    this.allParticipants = [];
    this.queryField.valueChanges.subscribe((result) =>
      this.userService.getAllUsersByQuery(result).subscribe((data) => {
        this.allParticipants = data;
      })
    );
    this.socketService.chatRooms$.subscribe((data) => {
      // @ts-ignore
      this.chatRooms = data;
    });
  }

  public cleanUnreadMessagesForRoom(): void {
    this.chatRoomService.cleanUnreadMessages(this.currentUser.id, this.currentClickedRoom.id);
  }

  private getAllRooms(): void {
    this.chatRoomService.getAllVisibleRooms().subscribe((data) => {
      this.chatRooms = data;
      console.log(this.chatRooms);
    });
  }

  private getCurrentUser(): void {
    this.userService.getCurrentUser().subscribe((data) => {
      this.currentUser = data;
      this.socketService.setCurrentUser(data);
    });
  }

  public setCurrentRoom(room: ChatRoom): void {
    this.currentClickedRoom = room;
    this.checkRoomMessages();
    this.socketService.setChatRoom(this.currentClickedRoom);
  }

  private getAllParticipants(): void {
    this.userService.getAllUsers().subscribe((data) => (this.allParticipants = data));
  }

  public getPrivateChatRoom(id: number): void {
    this.chatRoomService.getPrivateChatRoom(id).subscribe((data) => (this.currentClickedRoom = data));
    this.privateChatRoom = this.currentClickedRoom;
    this.checkRoomMessages();
    this.setCurrentRoom(this.privateChatRoom);
  }

  private checkRoomMessages() {
    if (this.currentClickedRoom && this.currentClickedRoom.messages) {
      this.currentClickedRoom.messages.sort((msg1, msg2) => (msg1.id > msg2.id ? 1 : -1));
    }
  }

  public getParticipant(participantName: string) {
    this.userService.getAllUsersByQuery(participantName).subscribe((data) => (this.allParticipants = data));
  }

  private getGroupsChatRooms() {
    this.chatRoomService.getGroupChatRooms().subscribe((data) => (this.groupChats = data));
  }

  //TODO: unused method?
  public openAddFileDialog(): void {
    this.chatRoomRef = this.dialog.open(ModalComponent, { hasBackdrop: false });
  }

  public getChatRooms(name: string): void {
    this.chatRoomService.getAllChatRoomsByQuery(name).subscribe((data) => (this.chatRooms = data));
  }

  public deleteChatRoom(room: ChatRoom): void {
    Swal.fire({
      title: 'Do you want to delete the chat-room?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: `Yes`,
      denyButtonText: `No`
    }).then((result) => {
      this.showUserResult(result, room);
    });
  }

  private showUserResult(result, room: ChatRoom) {
    if (result.isConfirmed) {
      if (this.currentClickedRoom.ownerId !== this.currentUser.id && this.currentClickedRoom.chatType === 'GROUP') {
        Swal.fire({
          icon: 'error',
          text: 'You are not owner of this chat'
        });
        return;
      }

      this.socketService.deleteChatRoom(room);
      this.chatRooms.forEach((chatRoom: ChatRoom, index: number) => {
        if (chatRoom.id === room.id) {
          this.chatRooms.splice(index, 1);
        }
      });
      Swal.fire('Success', '', 'success');
    } else if (result.isDenied) {
      Swal.fire('\n' + 'The chat-room has not been deleted', '', '');
    }
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  //TODO: IS THIS METHODS DUPLICATED ON 252 - 262 ?
  public add(member: User): void {
    this.list.push(member);
  }

  public remove(member: User): void {
    this.list.forEach((user: User, index: number) => {
      if (user.id === member.id) {
        this.list.splice(index, 1);
      }
    });
  }

  //TODO: REFACTOR ID
  public createGroupChat(): void {
    const name = (document.getElementById('chatName') as HTMLInputElement).value; // не бажано так робити | та ти шо

    this.chatRoom.usersId = this.list.map((user: User) => user.id);
    this.chatRoom.chatName = name;
    this.chatRoom.ownerId = this.currentUser.id;
    console.log(this.chatRoom);
    this.socketService.createNewChatRoom(this.chatRoom);
    window.location.assign('/');
  }

  public viewGroupInfo(info, room: ChatRoom) {
    this.currentClickedRoom = room;
    this.manageModalService(info);
  }

  public rename(name: string, room: ChatRoom) {
    this.currentClickedRoom = room;
    this.manageModalService(name);
  }

  public renameGroupChat(room: ChatRoom) {
    this.socketService.setChatRoom(room);
    room.name = this.model.chatName;
    this.socketService.updateChatRoom(room);

    window.location.assign('/');
  }

  public leaveGroupChat(id: number) {
    this.chatRooms.forEach((chatRoom: ChatRoom, index: number) => {
      if (chatRoom.id === id) {
        this.leaveChat.chatRoom = chatRoom;
        this.chatRooms.splice(index, 1);
      }
    });

    this.socketService.setCurrentUser(this.currentUser);
    this.leaveChat.userId = this.currentUser.id;
    this.socketService.leaveChatRoom(this.leaveChat);

    window.location.assign('/');
  }

  public removeParticipantsChatRoom(manage, room: ChatRoom): void {
    this.currentClickedRoom = room;
    this.list = this.currentClickedRoom.participants;
    this.manageModalService(manage);
  }

  public addParticipantsChatRoom(manage2, room: ChatRoom): void {
    this.currentClickedRoom = room;
    this.manageModalService(manage2);
  }

  public manageModalService(manage): void {
    this.modalService.open(manage, { ariaLabelledBy: 'modal-basic-title', backdrop: 'static' }).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
        window.location.assign('/');
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        window.location.assign('/');
      }
    );
  }

  // rename or add new participants to chat room
  public manageChatRoom(members: User[]) {
    members.forEach((user: User) => this.currentClickedRoom.participants.push(user));
    this.socketService.updateChatRoom(this.currentClickedRoom);
    window.location.assign('/');
  }

  public removeParticipantsFromChatRoom(members: User[]): void {
    members.forEach((user: User) => this.currentClickedRoom.participants.push(user));
    this.socketService.deleteParticipantChatRoom(this.currentClickedRoom);
    window.location.assign('/');
  }

  ngOnDestroy(): void {
    this.socketService.closeWebSocket();
  }
}
