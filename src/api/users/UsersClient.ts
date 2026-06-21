import type { 
  SignUpRequest, 
  SignUpResponse, 
  SignInRequest, 
  SignInResponse,
  CheckUserExistenceResponse,
  GetUserResponse,
  GetUsersResponse,
  GetUsersRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  GetLoginsResponse,
  ChangePasswordRequest,
  GetUsersLastSeenResponse,
  GetUsersLastSeenRequest,
  RecoverAccountRequest,
  RecoverAccountResponse,
  EndRecoverAccountRequest,
  EndRecoverAccountResponse,
  ResetPasswordRequest,
  BindEmailRequest,
  BindEmailResponse,
  EndBindEmailRequest,
  EndBindEmailResponse
} from './UsersContracts';
import { config } from '../../config/env';
import { fetchWithTimeout, handleResponse } from '../HttpClient';

const apiBaseUrl = config.apiUrl;

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
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    return handleResponse<GetUsersResponse>(response);
  },

  refresh: async (request: RefreshTokenRequest):  Promise<RefreshTokenResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'},
      body: JSON.stringify(request)
    });
    return handleResponse<RefreshTokenResponse>(response);
  },

  logoutMe: async (authToken: string): Promise<void> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    return handleResponse<void>(response);
  },

  logout: async (authToken: string, loginId: string): Promise<void> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/logout/${loginId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    return handleResponse<void>(response);
  },

  changePassword: async (authToken: string, request: ChangePasswordRequest): Promise<void> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
        body: JSON.stringify(request)
    });
    return handleResponse<void>(response);
  },

  getLogins: async (
  authToken: string,
  pageSize: number,
  pageNumber: number,
  isLogout: boolean
  ): Promise<GetLoginsResponse> => {
    const url = new URL(`${apiBaseUrl}/v1/auth/logins`);
    
    url.searchParams.set('pageSize', pageSize.toString());
    url.searchParams.set('pageNumber', pageNumber.toString());
    url.searchParams.set('isLogout', isLogout.toString());

    const response = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
  
    return handleResponse<GetLoginsResponse>(response);
  },

  ping: async (authToken: string): Promise<void> => {
    
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/users/online`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
  
    return handleResponse<void>(response);
  },

  recoverAccount: async (request: RecoverAccountRequest): Promise<RecoverAccountResponse> => {
    
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
  
    return handleResponse<RecoverAccountResponse>(response);
  },

  endRecoverAccount: async (request: EndRecoverAccountRequest): Promise<EndRecoverAccountResponse> => {
    
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/end-recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
  
    return handleResponse<EndRecoverAccountResponse>(response);
  },

  resetPassword: async (request: ResetPasswordRequest): Promise<void> => {
    
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
  
    return handleResponse<void>(response);
  },

  bindEmail: async (authToken: string, request: BindEmailRequest): Promise<BindEmailResponse> => {
    
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/bind-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
  
    return handleResponse<BindEmailResponse>(response);
  },

  endBindEmail: async (authToken: string, request: EndBindEmailRequest): Promise<EndBindEmailResponse> => {
    
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/auth/end-bind-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
  
    return handleResponse<EndBindEmailResponse>(response);
  },

  getUsersLastSeen: async (authToken: string, request: GetUsersLastSeenRequest): Promise<GetUsersLastSeenResponse> => {

    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/users/online/last-activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    return handleResponse<GetUsersLastSeenResponse>(response);
  }
}