import type {
  SendFriendshipInviteRequest,
  FriendshipInviteDto,
  FriendshipDto,
  GetFriendshipInviteListResponse,
  GetFriendListResponse
} from './FriendsContracts';
import { config } from '../../config/env';
import { fetchWithTimeout, handleResponse } from '../HttpClient';

const apiBaseUrl = config.friendsApiUrl;

export const friendsClient = {
  sendInvite: async (authToken: string, recipientId: string): Promise<FriendshipInviteDto> => {

    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/invites`, {
      method: 'POST',
      headers: getHeaders(authToken),
      body: JSON.stringify({ recipientId } as SendFriendshipInviteRequest),
    });
    return handleResponse<FriendshipInviteDto>(response);
  },

  acceptInvite: async (authToken: string, inviteId: string): Promise<FriendshipDto> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/invites/${inviteId}/accept`, {
      method: 'POST',
      headers: getHeaders(authToken),
    });
    return handleResponse<FriendshipDto>(response);
  },

  declineInvite: async (authToken: string, inviteId: string): Promise<FriendshipInviteDto> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/invites/${inviteId}/decline`, {
      method: 'POST',
      headers: getHeaders(authToken),
    });
    return handleResponse<FriendshipInviteDto>(response);
  },

  getInvites: async (
    authToken: string,
    incoming: boolean,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<GetFriendshipInviteListResponse> => {
    const params = new URLSearchParams({
      incoming: incoming.toString(),
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/invites?${params}`, {
      method: 'GET',
      headers: getHeaders(authToken),
    });
    return handleResponse<GetFriendshipInviteListResponse>(response);
  },

  getFriends: async (
    authToken: string,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<GetFriendListResponse> => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/friends?${params}`, {
      method: 'GET',
      headers: getHeaders(authToken),
    });
    return handleResponse<GetFriendListResponse>(response);
  },

  removeFriend: async (authToken: string, friendId: string): Promise<FriendshipDto> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/friends/${friendId}/remove`, {
      method: 'POST',
      headers: getHeaders(authToken),
    });
    return handleResponse<FriendshipDto>(response);
  }
};

function getHeaders(authToken: string | null): HeadersInit {
  return { 
      'Authorization': `Bearer ${authToken}`, 
      'Content-Type': 'application/json' 
    };
}