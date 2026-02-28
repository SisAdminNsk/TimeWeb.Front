import type { 
  SignUpRequest, 
  SignUpResponse, 
  SignInRequest, 
  SignInResponse,
  CheckUserExistenceResponse,
  GetUserResponse,
  GetUsersResponse,
  GetUsersRequest,
  GetProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse
} from './UsersContracts';
import { config } from '../../config/env';
import { fetchWithTimeout, handleResponse } from '../HttpClient';

const apiBaseUrl = config.usersApiUrl;

export const usersClient = {
  signUp: async (data: SignUpRequest): Promise<SignUpResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<SignUpResponse>(response);
  },

  signIn: async (data: SignInRequest): Promise<SignInResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SignInResponse>(response);
  },

  checkUserExistence: async (authToken: string, username: string): Promise<CheckUserExistenceResponse> => {
    const url = new URL(`${apiBaseUrl}/v1/users/check-existence`);
    url.searchParams.set('username', username);

    const response = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: {'Authorization': `Bearer ${authToken}`}
    });
    return handleResponse<CheckUserExistenceResponse>(response);
  },

  getUser: async (authToken: string, userId: string): Promise<GetUserResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/users/${userId}`, {
      method: 'GET',
      headers: {'Authorization': `Bearer ${authToken}`}
    });
    return handleResponse<GetUserResponse>(response);
  },

  getUsers: async (authToken: string, request: GetUsersRequest): Promise<GetUsersResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/users}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    return handleResponse<GetUsersResponse>(response);
  },

   getProfile: async (authToken: string, userId: string): Promise<GetProfileResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/users/profiles/${userId}`, {
      method: 'GET',
      headers: {'Authorization': `Bearer ${authToken}`}
    });
    return handleResponse<GetProfileResponse>(response);
  },

  updateProfile: async (authToken: string, userId: string, request: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/users/profiles/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'},
      body: JSON.stringify(request)
    });
    return handleResponse<UpdateProfileResponse>(response);
  },
}