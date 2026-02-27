import type { ApiErrorResponse, ApiError } from './ApiError';

const REQUEST_TIMEOUT = 10000; // 10 секунд
const STORAGE_KEY = 'app_session';

/**
 * Создает объект ошибки API с хелперами для полей
 */
export function createApiError(response: Response | null, body: ApiErrorResponse): ApiError {
  return {
    ...body,
    statusCode: response?.status || 0,
    getFieldError: (field: string) => body.details?.[field]?.[0],
    getFieldErrors: (field: string) => body.details?.[field],
  };
}

/**
 * Выполняет fetch с таймаутом
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<Response> {
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

/**
 * Обрабатывает ответ сервера, выбрасывая ApiError при ошибках
 */
export async function handleResponse<T>(response: Response): Promise<T> {
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

/**
 * Получает токен из сессии
 */
export function getAuthToken(): string | null {
  const session = localStorage.getItem(STORAGE_KEY);
  if (session) {
    const { token } = JSON.parse(session);
    return token;
  }
  return null;
}

export { REQUEST_TIMEOUT, STORAGE_KEY };