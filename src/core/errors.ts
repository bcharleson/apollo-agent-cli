export class ApolloError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'ApolloError';
  }
}

export class AuthError extends ApolloError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends ApolloError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApolloError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends ApolloError {
  public retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends ApolloError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'SERVER_ERROR', statusCode);
    this.name = 'ServerError';
  }
}

export class MasterKeyError extends ApolloError {
  constructor(endpoint: string) {
    super(
      `This endpoint requires a master API key: ${endpoint}\n` +
        'Enable it in Apollo → Settings → Integrations → API → Edit key → "Set as master key"',
      'MASTER_KEY_REQUIRED',
      403,
    );
    this.name = 'MasterKeyError';
  }
}

/**
 * Raised when the user supplies invalid CLI input (bad JSON, missing required
 * flag, oversized bulk array, mutually exclusive flags). Distinct from
 * `ValidationError` which is reserved for Apollo's 400/422 server responses.
 *
 * Agents should treat this as "fix your call args" rather than "retry".
 */
export class UserInputError extends ApolloError {
  constructor(message: string) {
    super(message, 'USER_INPUT_ERROR');
    this.name = 'UserInputError';
  }
}

export function formatError(error: unknown): { message: string; code: string } {
  if (error instanceof ApolloError) {
    return { message: error.message, code: error.code };
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError' || String(error.message).includes('aborted')) {
      return { message: 'Request timed out — the API did not respond in time', code: 'TIMEOUT' };
    }
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return { message: `Network error: ${error.message}`, code: 'NETWORK_ERROR' };
    }
    return { message: error.message, code: 'UNKNOWN_ERROR' };
  }
  return { message: String(error), code: 'UNKNOWN_ERROR' };
}
