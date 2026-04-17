import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrCreatePersonalChatId } from '../common/PersonalChatHelper';

interface UsePersonalChatOpenerResult {
  /**
   * Открывает личный чат с указанным пользователем
   * @param participantId ID пользователя
   * @param onChatOpened Callback, который вызывается после успешного получения ID чата
   */
  openPersonalChat: (
    participantId: string, 
    onChatOpened: (chatId: string) => void | Promise<void>
  ) => Promise<void>;
  
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const usePersonalChatOpener = (): UsePersonalChatOpenerResult => {
  const { getToken } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const clearError = useCallback(() => setError(null), []);
  
  const openPersonalChat = useCallback(async (
    participantId: string,
    onChatOpened: (chatId: string) => void | Promise<void>
  ): Promise<void> => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }
      
      const chatId = await getOrCreatePersonalChatId(token, participantId);
      
      await onChatOpened(chatId);
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось открыть чат';
      setError(message);
      console.error('Failed to open personal chat:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isLoading]);
  
  return {
    openPersonalChat,
    isLoading,
    error,
    clearError,
  };
};