import { ChatRoom } from "../chat-room/chat-room.model";

export class User {
  id: number;
  name: string;
  email: string;
  profilePicture: string;
  role: string;
  rooms: ChatRoom[];
}
