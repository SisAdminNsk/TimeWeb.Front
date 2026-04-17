import { chatsClient } from '../api/chats/ChatsClient';
import type { ApiError } from '../api/ApiError';

/**
 * Получает существующий личный чат или создаёт новый, если не найден
 * @param authToken Токен авторизации
 * @param participantId ID пользователя, с которым нужно создать чат
 * @returns Promise с ID чата
 */
export const getOrCreatePersonalChatId = async (
  authToken: string,
  participantId: string
): Promise<string> => {
  try {
    // Пытаемся получить существующий чат
    const response = await chatsClient.getPersonalChat(authToken, participantId);
    return response.chatId;
  } catch (err: unknown) {
    const error = err as ApiError;
    
    // Если чат не найден (404) — создаём новый
    if (error?.statusCode === 404) {
      const createResponse = await chatsClient.createPersonalChat(authToken, { 
        participantId 
      });
      return createResponse.chatId;
    }
    
    throw err;
  }
};