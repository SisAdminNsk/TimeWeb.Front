import type { 
  SignUpRequest, 
  SignUpResponse, 
  SignInRequest, 
  SignInResponse,
  CheckUserExistenceResponse
} from './UsersContracts';
import { config } from '../../config/env';
import { fetchWithTimeout, handleResponse, STORAGE_KEY } from '../HttpClient';

const API_BASE = config.usersApiUrl;

export interface UserSession {
  token: string;
  name: string;
}

export const usersClient = {
  signUp: async (data: SignUpRequest): Promise<SignUpResponse> => {
    const response = await fetchWithTimeout(`${API_BASE}/v1/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<SignUpResponse>(response);
  },

  signIn: async (data: SignInRequest): Promise<SignInResponse> => {
    const response = await fetchWithTimeout(`${API_BASE}/v1/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SignInResponse>(response);
  },

  checkUserExistence: async (username: string): Promise<CheckUserExistenceResponse> => {
    const url = new URL(`${API_BASE}/v1/users/check-existence`);
    url.searchParams.set('username', username);

    const response = await fetchWithTimeout(url.toString(), {
      method: 'GET'
    });
    return handleResponse<CheckUserExistenceResponse>(response);
  },
  
  getSession: (): UserSession | null => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },
  
  setSession: (session: UserSession): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  },
  
  clearSession: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },
  
  getAuthHeader: (): HeadersInit | undefined => {
    const session = usersClient.getSession();
    if (session?.token) {
      return { 'Authorization': `Bearer ${session.token}` };
    }
    return undefined;
  }
};