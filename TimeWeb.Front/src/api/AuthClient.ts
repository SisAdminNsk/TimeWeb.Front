import type { 
  SignUpRequest, 
  SignUpResponse, 
  SignInRequest, 
  SignInResponse, 
  ApiErrorResponse,
  ApiError
} from './AuthTypes';

import { config } from '../config/env';

const API_BASE = config.apiBaseUrl;
const STORAGE_KEY = 'app_session';
const REQUEST_TIMEOUT = 10000; // 10 секунд

export interface UserSession {
  token: string;
  name: string;
}

function createApiError(response: Response | null, body: ApiErrorResponse): ApiError {
  return {
    ...body,
    statusCode: response?.status || 0,
    getFieldError: (field: string) => body.details?.[field]?.[0],
    getFieldErrors: (field: string) => body.details?.[field],
  };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorBody: ApiErrorResponse | null = null;
    try {
      const text = await response.text();
      if (text) errorBody = JSON.parse(text) as ApiErrorResponse;
    } catch {}
    
    const apiError = createApiError(response, errorBody ?? {
      errorCode: 'HTTP_ERROR',
      errorMessage: `Ошибка ${response.status}: ${response.statusText}`,
    });
    throw apiError;
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export const authClient = {
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
    const session = authClient.getSession();
    if (session?.token) {
      return { 'Authorization': `Bearer ${session.token}` };
    }
    return undefined;
  }
};