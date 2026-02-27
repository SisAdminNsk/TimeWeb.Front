import type { ApiErrorResponse, ApiError } from './ApiError';

const REQUEST_TIMEOUT = 10000; // 10 секунд

export function createApiError(response: Response | null, body: ApiErrorResponse): ApiError {
  return {
    ...body,
    statusCode: response?.status || 0,
    getFieldError: (field: string) => body.details?.[field]?.[0],
    getFieldErrors: (field: string) => body.details?.[field],
  };
}

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

export { REQUEST_TIMEOUT };