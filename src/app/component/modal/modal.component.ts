import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../service/user/user.service';
import { User } from '../../model/user/user.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChatRoomService } from '../../service/chat-room/chat-room.service';
import { SocketService } from '../../service/socket/socket.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})

export class ModalComponent implements OnInit {
  public form: FormGroup;
  public allParticipants: User[];
  public list: User[] = [];
  public data: any;

  @ViewChild('chatName') chatName: ElementRef;

  constructor(
    private userService: UserService,
    private socketService: SocketService,
    private chatRoomService: ChatRoomService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ModalComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.data = data;
  }

  ngOnInit() {
    this.userService.getAllUsers().subscribe((data) => (this.allParticipants = data));
    this.form = this.formBuilder.group({
      name: ''
    });
  }

  public add(member: User): void {
    this.list.push(member);
  }

  public remove(member: User): void {
    this.list.forEach((user: User, index) => {
      if (user.id === member.id) {
        this.list.splice(index, 1);
      }
    });
  }

  public createGroupChat(): void {
    const name = this.chatName.nativeElement.value;

    this.chatRoomService.createGroupChatRoom(this.list, name);

    window.location.assign('/');
    this.dialogRef.close();
  }
}
