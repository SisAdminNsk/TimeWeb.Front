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