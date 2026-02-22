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