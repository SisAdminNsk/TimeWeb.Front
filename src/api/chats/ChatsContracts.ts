export interface MessageDto {
  id: string,
  chatId: string,
  senderId: string,
  senderName: string,
  content: string,
  createdAt: string,
  isRead: boolean
}

export interface GetChatHistoryResponse{
    totalCount: number,
    messages: MessageDto[]
}

export interface CreateChatRequest{
    chatId: string,
    chatName: string,
    participantIds: string[]
}

export interface CreateChatResponse{
    chatId: string
}

export interface CreatePersonalChatRequest{
    participantId: string
}

export interface CreatePersonalChatResponse{
    chatId: string
}

export interface GetPersonalChatResponse{
    chatId: string
}

export interface CheckUpdatesResponse{
  updates: ChatUpdatesDto[]
}

export interface ChatUpdatesDto{
  chatId: string
  hasUpdates: boolean
  unreadCount: number
}

export interface VoiceParticipant {
  userId: string;
  username: string;
  connectionId: string;
  isSpeaking: boolean;
  audioLevel: number;
  lastActiveTime: number;
}

export interface VoiceCallState {
  isConnected: boolean;
  isJoined: boolean;
  isMuted: boolean;
  participants: Map<string, VoiceParticipant>;
  localStream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
  permissionDenied: boolean;
}
export interface SignalMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
  from: string; // connectionId отправителя
  to: string;   // connectionId получателя
}

export const VOICE_HUB_EVENTS = {
  USER_JOINED: 'UserJoined',
  USER_LEFT: 'UserLeft',
  RECEIVE_SIGNAL: 'ReceiveSignal',
} as const;

export const VOICE_HUB_METHODS = {
  JOIN_CHAT: 'JoinChat',
  LEAVE_CHAT: 'LeaveChat',
  SEND_SIGNAL: 'SendSignal',
} as const;

export const AUDIO_CONFIG = {
  SPEAKING_THRESHOLD: 0.02,      // RMS порог для "говорит"
  SPEAKING_DEBOUNCE_MS: 300,     // Задержка перед снятием статуса "говорит"
  FFT_SIZE: 256,                 // Размер буфера для анализатора
} as const;