import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { User } from '../../model/user/user.model';
import { ChatRoom } from '../../model/chat-room/chat-room.model';
import { SocketService } from '../../service/socket/socket.service';
import { ChatMessage } from '../../model/chat-message/chat-message.model';
import { DatePipe } from '@angular/common';
import { ChatMessageService } from '../../service/chat-message/chat-message.service';
import { ChatRoomsComponent } from '../chat-rooms/chat-rooms.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ChatFileService } from 'src/app/service/chat-file/chat-file.service';
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageLike } from '../../model/chat-message/message-like.model';

@Component({
  selector: 'app-chat-messages',
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.scss'],
  providers: [DatePipe]
})
export class ChatMessagesComponent implements OnInit, OnDestroy {
  public messageLike: MessageLike;
  public primaryGreen = '#10804E';
  public redColor = 'red';
  public lastMessage: number;
  public spiner: boolean;
  public sendBtnDisabled: boolean;
  public nameFileHide: boolean;
  // Record OBJ
  public record;
  // Will use this flag for toggeling recording
  public recording = false;
  public error: Error;
  public newMessage = '';
  public webSocket: any;
  public stompClient: any;
  public encodedString: string;
  public file: any;
  public fileName: string;
  public fileUrl: string;
  public fileType: string;
  public showFileSelected: boolean;
  public showVoiceMessageName: boolean;
  public uploadForm: FormGroup;


  @Input() room: ChatRoom;
  @Input() currentUser: User;

  @ViewChild('fileUpload') fileUpload: ElementRef;
  @ViewChild('fileSelectId') fileSelect: ElementRef;
  @ViewChild('voiceMessageButton') voiceMessageBtn: ElementRef;

  // tslint:disable-next-line:max-line-length
  constructor(private socketService: SocketService,
              private chatMessageService: ChatMessageService,
              private chatRoomComponent: ChatRoomsComponent,
              private formBuilder: FormBuilder,
              private fileService: ChatFileService,
              private domSanitizer: DomSanitizer) {
  }
  static lastMessage: number;

  ngOnInit(): void {
    this.socketService.setChatRoom(this.room);
    this.room.messages.sort( (msg1, msg2) => ( msg1.id > msg2.id ? 1 : -1));
    console.log(this.room.messages);
    this.socketService.setCurrentUser(this.currentUser);
    this.getLastMessageId();
    this.uploadForm = this.formBuilder.group({
      profile: ['']
    });
    this.showFileSelected = false;
  }

  // tslint:disable-next-line:typedef
  public sendMessage() {
        try {
      this.socketService.setChatRoom(this.room);
      const chatMessage = new ChatMessage();
      ++ChatMessagesComponent.lastMessage;
      chatMessage.id = ChatMessagesComponent.lastMessage;
      chatMessage.content = this.newMessage;
      chatMessage.senderId = this.currentUser.id;
      chatMessage.roomId = this.room.id;
      chatMessage.fileName = this.fileName;
      chatMessage.fileUrl = this.fileUrl;
      chatMessage.fileType = this.fileType;

      if (this.newMessage.trim() === '' && chatMessage.fileName === undefined) {
        return;
      }

      this.socketService.sendMessage(chatMessage);
      this.newMessage = '';

      if (this.room.messages.length === 0 && this.room.chatType === 'PRIVATE') {
        this.chatRoomComponent.chatRooms.push(this.room);
      }
    } catch (err) {
      console.log(err);
    }
        this.fileName = undefined;
        this.fileType = null;
        this.fileUrl = null;
        this.showVoiceMessageName = false;
        this.showFileSelected = false;
        this.fileUpload.nativeElement.nodeValue = '';
        this.fileSelect.nativeElement.innerText = '';
        this.nameFileHide = true;
        console.log(this.fileUpload, this.fileSelect)
  }
    //TODO: messageId = string?
    public deleteMessage(messageId): void {
      this.socketService.setChatRoom(this.room);

      this.room.messages.forEach((msg, index) => {
        if (msg.id === messageId) {
          this.socketService.deleteMessage(this.room.messages[index]);
        }
      });

      if (this.room.messages.length === 1 && this.room.chatType === 'PRIVATE') {
        this.chatRoomComponent.chatRooms.forEach((chatRoom, index) => {
          if (this.room.id === chatRoom.id) {
            this.chatRoomComponent.chatRooms.splice(index, 1);
          }
        });
      }
    }

    //TODO: messageId, content = string?
    public updateMessage(messageId, content): void {
      this.socketService.setChatRoom(this.room);
      content = prompt('Update message please', content);
      this.room.messages.forEach((msg, index) => {
        if (msg.id === messageId) {
          this.room.messages[index].content = content;
          this.socketService.updateMessage(this.room.messages[index]);
        }
      });
    }

    //TODO: messageId = string?
    public likeMessage(messageId): void {
      this.messageLike.messageId = messageId;
      this.messageLike.participantId = this.currentUser.id;
      this.socketService.likeMessage(this.messageLike);
    }

    private getLastMessageId(): void {
      this.chatMessageService.getLastMessageId().subscribe((data) => (this.lastMessage = data));
    }

    public onFileSelect(event) {
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        this.uploadForm.get('profile').setValue(file);
        this.fileSelect.nativeElement.innerText = this.uploadForm.get('profile').value.name;
        const formData = new FormData();
        formData.append('file', this.uploadForm.get('profile').value);
        this.sendFile(formData);
      }
    }

    private sendFile(file: FormData): void {
      this.spiner = true;
      this.sendBtnDisabled = true;
      this.nameFileHide = false;

      this.fileService.sendFile(file).subscribe((data) => {
        this.fileName = data.fileName;
        this.fileType = data.fileType;
        this.fileUrl = data.fileUrl;
        this.spiner = false;
        this.sendBtnDisabled = false;
      });
    }

    //TODO: no usage detected, maybe delete?
    sanitize(url: string) {
      return this.domSanitizer.bypassSecurityTrustUrl(url);
    }

    /**
     * Start recording.
     */

    //TODO: binding?
    private initiateRecording(): void {
      this.recording = true;

      const mediaConstraints = {
        video: false,
        audio: true
      };

      this.voiceMessageBtn.nativeElement.style.backgroundColor = this.redColor;
      navigator.mediaDevices.getUserMedia(mediaConstraints).then(this.successCallback.bind(this), this.errorCallback.bind(this));
    }
    /**
     * Will be called automatically.
     */

    //TODO: wtf is stream, bytes?
    private successCallback(stream) {
      const options = {
        mimeType: 'audio/wav',
        numberOfAudioChannels: 1,
        sampleRate: 45000 // швидкість відтворення
      };
      // Start Actuall Recording
      const StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
      this.record = new StereoAudioRecorder(stream, options);
      this.record.record();
    }

    //TODO: binding?
    private stopRecording() {
      this.recording = false;
      this.record.stop(this.processRecording.bind(this));
      this.voiceMessageBtn.nativeElement.style.backgroundColor = this.primaryGreen;
    }

    //TODO: wtf is blob, bytes?
    private processRecording(blob) {
      this.spiner = true;
      this.sendBtnDisabled = true;

      const formData = new FormData();
      formData.append('file', blob);

      this.fileService.sendVoiceFile(formData).subscribe((data) => {
        this.fileName = data.fileName;
        this.fileType = data.fileType;
        this.fileUrl = data.fileUrl;
        this.showVoiceMessageName = true;
        this.spiner = false;
        this.sendBtnDisabled = false;
      });
    }

    private errorCallback(error: Error) {
      this.error = new Error('Can not play audio in your browser');
    }

    public deleteVoiceMessage() {
      this.deleteFileOptions();
      this.showVoiceMessageName = false;
    }

    public deleteFile(): void {
      this.deleteFileOptions();

      this.fileUpload.nativeElement.nodeValue = '';
      this.fileSelect.nativeElement.innerText = '';
      this.nameFileHide = true;
    }

    private deleteFileOptions(): void {
      this.fileService.deleteFile(this.fileName).subscribe((data) => console.log(data));
      this.fileName = undefined;
      this.fileType = null;
    }

    public recordVoiceMessage() {
      if (!this.recording) {
        this.initiateRecording();
      } else {
        this.stopRecording();
      }
    }

    ngOnDestroy(): void {
      this.socketService.closeWebSocket();
    }
  }
