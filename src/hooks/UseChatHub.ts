import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from '../context/AuthContext';
import { chatsClient } from '../api/chats/ChatsClient';
import { usersClient } from '../api/users/UsersClient';
import { config } from '../config/env';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  username: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface UseChatHubResult {
  isConnected: boolean;
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  joinChat: (chatId: string) => Promise<void>;
  leaveChat: (chatId: string) => Promise<void>;
  error: string | null;
  reconnect: () => Promise<void>;
  isLoadingHistory: boolean;
  hasMoreHistory: boolean;
  loadMoreHistory: () => Promise<void>;
}

const MESSAGES_PER_PAGE = 200;
const MAX_MESSAGES = 5000;

const chatsApiUrl = config.chatsApiUrl;

const isUnauthorizedError = (err: unknown): boolean => {
  if (!err) return false;
  const e = err as any;
  return (
    e?.statusCode === 401 ||
    e?.message?.includes('401') ||
    e?.message?.includes('Unauthorized') ||
    (e?.name === 'HttpError' && e?.statusCode === 401)
  );
};

export const useChatHub = (): UseChatHubResult => {
  const { getToken, handleUnauthorized } = useAuth();

  // ✅ Стейты только для UI-состояний
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // ✅ Реф для хранения экземпляра соединения (императивный доступ)
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const currentChatId = useRef<string | null>(null);

  const currentPageRef = useRef<number>(1);
  const totalPagesRef = useRef<number>(1);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const totalCountRef = useRef<number>(0);

  // ──────────────────────────────────────────────
  const createConnection = useCallback((): signalR.HubConnection => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${chatsApiUrl}/chat`, {
        accessTokenFactory: () => {
          try {
            return getToken();
          } catch {
            return '';
          }
        },
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    newConnection.on('ReceiveMessage', (message: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        const newMessages = [...prev, message];
        return newMessages.length > MAX_MESSAGES
          ? newMessages.slice(newMessages.length - MAX_MESSAGES)
          : newMessages;
      });
    });

    newConnection.onclose(() => setIsConnected(false));
    newConnection.onreconnecting(() => setIsConnected(false));

    newConnection.onreconnected(async () => {
      setIsConnected(true);
      if (currentChatId.current) {
        try {
          await newConnection.invoke('JoinChat', currentChatId.current);
        } catch (err) {
          console.error('Failed to rejoin chat after reconnect:', err);
        }
      }
    });

    return newConnection;
  }, [getToken]);

  // ──────────────────────────────────────────────
  const loadMessagesPage = useCallback(async (
    chatId: string,
    pageNumber: number,
    pageSize: number = MESSAGES_PER_PAGE
  ): Promise<{ messages: Message[]; totalCount: number }> => {
    const token = getToken();
    const response = await chatsClient.getChatHistory(token, chatId, pageNumber, pageSize);

    const messagesList = response.messages?.map(m => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      username: m.senderName,
      content: m.content,
      createdAt: m.createdAt,
      isRead: m.isRead,
    })) || [];

    return { messages: messagesList, totalCount: response.totalCount || 0 };
  }, [getToken]);

  // ──────────────────────────────────────────────
  const startConnectionWithRefresh = useCallback(async (conn: signalR.HubConnection) => {
    if (conn.state === signalR.HubConnectionState.Connected) return;

    try {
      await conn.start();
    } catch (err: unknown) {
      if (isUnauthorizedError(err)) {
        console.warn('SignalR connection → 401, trying refresh token...');

        const sessionStr = localStorage.getItem('user_session');
        if (!sessionStr) throw err;

        const session = JSON.parse(sessionStr);
        if (!session?.refreshToken) throw err;

        try {
          const refreshResponse = await usersClient.refresh({ token: session.refreshToken });
          const newSession = {
            ...session,
            accessToken: refreshResponse.accessToken,
            refreshToken: refreshResponse.refreshToken,
          };
          localStorage.setItem('user_session', JSON.stringify(newSession));

          await conn.start();
          console.log('SignalR reconnected with refreshed token');
          return;
        } catch (refreshErr) {
          console.error('Refresh token failed during SignalR connect:', refreshErr);
          handleUnauthorized({ statusCode: 401 } as any);
          throw refreshErr;
        }
      }
      throw err;
    }
  }, [handleUnauthorized]);

  // ──────────────────────────────────────────────
  const joinChat = useCallback(async (chatId: string) => {
    const conn = connectionRef.current;
    if (!conn) throw new Error('Connection not initialized');

    try {
      setError(null);
      currentChatId.current = chatId;

      await startConnectionWithRefresh(conn);

      await conn.invoke('JoinChat', chatId);

      setIsConnected(true);
      setMessages([]);
      loadedPagesRef.current.clear();
      currentPageRef.current = 1;
      totalPagesRef.current = 1;
      totalCountRef.current = 0;

      setIsLoadingHistory(true);
      try {
        const { messages: firstPageMessages, totalCount } = await loadMessagesPage(chatId, 1);
        totalCountRef.current = totalCount;

        if (totalCount === 0) {
          setHasMoreHistory(false);
          return;
        }

        const totalPages = Math.ceil(totalCount / MESSAGES_PER_PAGE);
        totalPagesRef.current = totalPages;
        loadedPagesRef.current.add(1);

        const sortedMessages = [...firstPageMessages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setMessages(sortedMessages);
        setHasMoreHistory(totalPages > 1);
      } finally {
        setIsLoadingHistory(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join chat');
      throw err;
    }
  }, [startConnectionWithRefresh, loadMessagesPage]);

  // ──────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    const conn = connectionRef.current;
    if (!conn || !currentChatId.current) throw new Error('Not connected to chat');

    const token = getToken();

    try {
      await conn.invoke('SendMessage', currentChatId.current, token, content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setError(msg);
      throw err;
    }
  }, [getToken]);

  // ──────────────────────────────────────────────
  const leaveChat = useCallback(async (chatId: string) => {
    const conn = connectionRef.current;
    if (!conn) return;
    try {
      await conn.invoke('LeaveChat', chatId);
      currentChatId.current = null;
      loadedPagesRef.current.clear();
      setMessages([]);
      currentPageRef.current = 1;
      totalPagesRef.current = 1;
      totalCountRef.current = 0;
      setHasMoreHistory(true);
    } catch (err) {
      console.error('Failed to leave chat:', err);
    }
  }, []);

  // ──────────────────────────────────────────────
  const loadMoreHistory = useCallback(async () => {
    if (!currentChatId.current || isLoadingHistory || !hasMoreHistory) return;

    const nextPage = currentPageRef.current + 1;
    if (loadedPagesRef.current.has(nextPage) || nextPage > totalPagesRef.current) {
      setHasMoreHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const { messages: olderMessages } = await loadMessagesPage(
        currentChatId.current,
        nextPage
      );

      if (olderMessages.length === 0) {
        setHasMoreHistory(false);
        return;
      }

      loadedPagesRef.current.add(nextPage);
      currentPageRef.current = nextPage;

      setMessages((prev) => {
        const newIds = new Set(olderMessages.map((m) => m.id));
        const filteredPrev = prev.filter((m) => !newIds.has(m.id));

        const combined = [...olderMessages, ...filteredPrev];
        const sorted = combined.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        return sorted.length > MAX_MESSAGES
          ? sorted.slice(sorted.length - MAX_MESSAGES)
          : sorted;
      });

      setHasMoreHistory(nextPage < totalPagesRef.current);
    } catch (err) {
      console.error('Failed to load more history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isLoadingHistory, hasMoreHistory, loadMessagesPage]);

  // ──────────────────────────────────────────────
  const reconnect = useCallback(async () => {
    const conn = connectionRef.current;
    if (conn) await conn.stop();

    const newConnection = createConnection();
    connectionRef.current = newConnection; // ✅ Только реф, без setConnection

    try {
      await startConnectionWithRefresh(newConnection);

      setIsConnected(true);

      if (currentChatId.current) {
        await newConnection.invoke('JoinChat', currentChatId.current);
      }
    } catch (err) {
      console.error('Reconnect failed:', err);
    }
  }, [createConnection, startConnectionWithRefresh]);

  // ──────────────────────────────────────────────
  useEffect(() => {
    const newConnection = createConnection();
    connectionRef.current = newConnection; // ✅ Только реф

    return () => {
      newConnection.stop().catch(console.error);
    };
  }, [createConnection]);

  return {
    isConnected,
    messages,
    sendMessage,
    joinChat,
    leaveChat,
    error,
    reconnect,
    isLoadingHistory,
    hasMoreHistory,
    loadMoreHistory,
  };
};