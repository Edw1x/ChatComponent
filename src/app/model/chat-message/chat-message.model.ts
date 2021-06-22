export class ChatMessage {
  public id: number;
  public roomId: number;
  public content: string;
  public senderId: number;
  public status: string;
  public fileName: string;
  public fileType: string;
  public fileUrl: string;
  public likedUserId: Array<number>;
}
