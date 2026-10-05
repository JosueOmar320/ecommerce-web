import type { ErrorResponse } from './schema';

export type ApiErrorBody = ErrorResponse['error'];

/** Every failed API call surfaces as an ApiError carrying the backend's stable error `code`. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown = null,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** No HTTP response at all (offline, DNS, CORS, server down). */
  get isNetworkError() {
    return this.status === 0;
  }

  /** Field-level issues from a 400 VALIDATION_ERROR, keyed by JSON pointer (e.g. "/email"). */
  get fieldIssues(): Record<string, string> {
    const issues = (this.details as { issues?: { path: string; message: string }[] } | null)
      ?.issues;
    return Object.fromEntries((issues ?? []).map((issue) => [issue.path, issue.message]));
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const networkError = () => new ApiError(0, 'NETWORK_ERROR', 'Network request failed');

function isErrorEnvelope(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'object' &&
    typeof (value as ErrorResponse).error.code === 'string'
  );
}

/** Builds an ApiError from any non-2xx response, even when the body is not the standard envelope. */
export function toApiError(status: number, body: unknown): ApiError {
  if (isErrorEnvelope(body)) {
    const { code, message, details, requestId } = body.error;
    return new ApiError(status, code, message, details, requestId);
  }
  return new ApiError(
    status,
    status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR',
    `HTTP ${status}`,
  );
}
