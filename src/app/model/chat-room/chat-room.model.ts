import {User} from '../user/user.model';
import {ChatMessage} from '../chat-message/chat-message.model';

export class ChatRoom {
  public id: number;
  public name: string;
  public messages: ChatMessage[];
  public chatType: string;
  public participants: User[];
  public ownerId: number;
  public amountUnreadMessages: number;
}
