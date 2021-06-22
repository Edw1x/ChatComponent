export const backendCoreLink = 'http://localhost:8080';
export const backendChatLink = 'http://localhost:8070/chat';

export const webSocketLink = 'http://localhost:8070';
export const webSocketEndPointLink = '/ws';

export const participantLink = backendChatLink + '/user';
export const currentUserLink = backendCoreLink + '/user';

export const allParticipantsLink = backendChatLink + '/users';
export const allParticipantsByQuery = allParticipantsLink + '/';

export const leaveChatRoomLink = backendChatLink + '/room/leave';
export const manageParticipantsChatRoomLink = backendChatLink + '/room/manage/participants';
