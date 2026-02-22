export interface SignUpRequest {
  name: string;
  password: string;
}

export interface SignUpResponse {
  id: string;
  name: string;
}

export interface SignInRequest {
  username: string;
  password: string;
}

export interface SignInResponse {
  token: string;
}

export interface ApiErrorResponse {
  errorCode: string;
  errorMessage?: string;
  details?: Record<string, string[]>;
  traceId?: string;
  timestamp?: string; // DateTime приходит как ISO-строка
  stackTrace?: string;
}

export interface ApiError extends ApiErrorResponse {
  statusCode: number;
  getFieldError: (fieldName: string) => string | undefined;
  getFieldErrors: (fieldName: string) => string[] | undefined;
}