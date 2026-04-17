import type {
    CreateChatRequest,
  GetChatHistoryResponse,
  CreateChatResponse,
  CreatePersonalChatRequest,
  CreatePersonalChatResponse,
  GetPersonalChatResponse
} from './ChatsContracts';
import { config } from '../../config/env';
import { fetchWithTimeout, handleResponse } from '../HttpClient';

const apiBaseUrl = config.chatsApiUrl;

export const chatsClient = {
  getChatHistory: async (
    authToken: string,
    chatId: string,
    pageNumber: number,
    pageSize: number): Promise<GetChatHistoryResponse> => {

    const params = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString()
    });

    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/chats/${chatId}?${params}`, {
      method: 'GET',
      headers: getHeaders(authToken)
    });
    return handleResponse<GetChatHistoryResponse>(response);
  },

  createChat: async(
    authToken: string,
    request: CreateChatRequest): Promise<CreateChatResponse> => {

    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/chats`, {
      method: 'POST',
      headers: getHeaders(authToken),
      body: JSON.stringify(request)
    });
    return handleResponse<CreateChatResponse>(response);
  },

  createPersonalChat: async(
    authToken: string,
    request: CreatePersonalChatRequest): Promise<CreatePersonalChatResponse> => {

    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/chats/personal-chat`, {
      method: 'POST',
      headers: getHeaders(authToken),
      body: JSON.stringify(request)
    });
    return handleResponse<CreatePersonalChatResponse>(response);
  },

  getPersonalChat: async(authToken: string, participantId: string): Promise<GetPersonalChatResponse> => {

    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/chats/personal-chat/${participantId}`, {
      method: 'GET',
      headers: getHeaders(authToken)
    });
    return handleResponse<GetPersonalChatResponse>(response);
  }
};

function getHeaders(authToken: string | null): HeadersInit {
  return { 
      'Authorization': `Bearer ${authToken}`, 
      'Content-Type': 'application/json' 
    };
}