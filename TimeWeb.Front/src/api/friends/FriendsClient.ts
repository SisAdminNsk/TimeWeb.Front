import type {
  SendFriendshipInviteRequest,
  FriendshipInviteDto,
  FriendshipDto,
  GetFriendshipInviteListResponse,
  GetFriendListResponse
} from './FriendsContracts';
import { config } from '../../config/env';
import { fetchWithTimeout, handleResponse, getAuthHeaders } from '../HttpClient';

const API_BASE = config.friendsApiUrl;

export const friendsClient = {
  sendInvite: async (recipientId: string): Promise<FriendshipInviteDto> => {
    const response = await fetchWithTimeout(`${API_BASE}/v1/invites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recipientId } as SendFriendshipInviteRequest),
    });
    return handleResponse<FriendshipInviteDto>(response);
  },

  acceptInvite: async (inviteId: string): Promise<FriendshipDto> => {
    const response = await fetchWithTimeout(`${API_BASE}/v1/invites/${inviteId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<FriendshipDto>(response);
  },

  declineInvite: async (inviteId: string): Promise<FriendshipInviteDto> => {
    const response = await fetchWithTimeout(`${API_BASE}/v1/invites/${inviteId}/decline`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<FriendshipInviteDto>(response);
  },

  getInvites: async (
    incoming: boolean,
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<GetFriendshipInviteListResponse> => {
    const params = new URLSearchParams({
      incoming: incoming.toString(),
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await fetchWithTimeout(`${API_BASE}/v1/invites?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<GetFriendshipInviteListResponse>(response);
  },

  getFriends: async (
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<GetFriendListResponse> => {
    const params = new URLSearchParams({
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await fetchWithTimeout(`${API_BASE}/v1/friends?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<GetFriendListResponse>(response);
  },

  removeFriend: async (friendId: string): Promise<FriendshipDto> => {
    const response = await fetchWithTimeout(`${API_BASE}/v1/friends/${friendId}/remove`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<FriendshipDto>(response);
  },
};