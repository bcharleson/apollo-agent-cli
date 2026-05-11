import type { ApolloClient as IApolloClient } from './types.js';
import {
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  ApolloError,
  MasterKeyError,
} from './errors.js';

const BASE_URL = 'https://api.apollo.io/api/v1';
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30_000;
const WRITE_TIMEOUT = 15_000;
const VERSION = '0.1.0';

/**
 * Master-key matchers — each entry is a (method, path-regex) tuple that
 * pinpoints exactly which endpoints require a master API key. We use
 * explicit regexes (rather than `path.startsWith(...)`) so we can include
 * `/accounts` (POST) without accidentally matching `/accounts/search`,
 * and include `/organizations/{id}` (GET) without matching `/organizations/enrich`.
 *
 * Source of truth: Apollo API docs + apollo-cli AGENTS.md endpoint annotations.
 * Keep this list in sync with the `[master key]` markers in AGENTS.md.
 */
export const MASTER_KEY_PATTERNS: Array<{ method: string; regex: RegExp; label: string }> = [
  // Accounts — write operations require master key (search does not)
  { method: 'POST', regex: /^\/accounts$/, label: 'accounts.create' },
  { method: 'PATCH', regex: /^\/accounts\/[^/]+$/, label: 'accounts.update' },
  { method: 'POST', regex: /^\/accounts\/bulk_create$/, label: 'accounts.bulk_create' },
  { method: 'POST', regex: /^\/accounts\/bulk_update$/, label: 'accounts.bulk_update' },
  { method: 'POST', regex: /^\/accounts\/update_labels$/, label: 'accounts.update_labels' },
  // Contacts — bulk + label-management require master key (search/get/update do not)
  { method: 'POST', regex: /^\/contacts\/bulk_update$/, label: 'contacts.bulk_update' },
  { method: 'POST', regex: /^\/contacts\/update_labels$/, label: 'contacts.update_labels' },
  // Organizations — GET by 24-char hex ID requires master key
  // (this regex deliberately excludes /organizations/enrich, /organizations/bulk_enrich, /organizations/search)
  { method: 'GET', regex: /^\/organizations\/[a-f0-9]{20,}$/i, label: 'organizations.get' },
  // Sequences (emailer_campaigns) — all operations require master key
  { method: 'POST', regex: /^\/emailer_campaigns(\/.*)?$/, label: 'sequences.*' },
  { method: 'GET', regex: /^\/emailer_campaigns(\/.*)?$/, label: 'sequences.*' },
  // Email messages — all reads require master key
  { method: 'GET', regex: /^\/emailer_messages(\/.*)?$/, label: 'emails.*' },
  // Deals / opportunities — all operations require master key
  { method: 'POST', regex: /^\/opportunities(\/.*)?$/, label: 'deals.*' },
  { method: 'PATCH', regex: /^\/opportunities\/[^/]+$/, label: 'deals.update' },
  { method: 'GET', regex: /^\/opportunities(\/.*)?$/, label: 'deals.*' },
  // Tasks — all operations require master key
  { method: 'POST', regex: /^\/tasks(\/.*)?$/, label: 'tasks.*' },
  { method: 'GET', regex: /^\/tasks(\/.*)?$/, label: 'tasks.*' },
  // Phone calls — log + search require master key
  { method: 'GET', regex: /^\/phone_calls\/search$/, label: 'calls.search' },
  { method: 'POST', regex: /^\/phone_calls$/, label: 'calls.create' },
  // Users
  { method: 'GET', regex: /^\/users\/search$/, label: 'users.list' },
  // Email accounts
  { method: 'GET', regex: /^\/email_accounts(\/.*)?$/, label: 'email-accounts.*' },
  // Usage stats
  { method: 'POST', regex: /^\/usage_stats(\/.*)?$/, label: 'usage-stats.*' },
  // Typed custom fields (read)
  { method: 'GET', regex: /^\/typed_custom_fields$/, label: 'custom-fields.list' },
  // Reports / analytics
  { method: 'POST', regex: /^\/reports(\/.*)?$/, label: 'analytics.*' },
];

export function isMasterKeyEndpoint(method: string, path: string): boolean {
  return MASTER_KEY_PATTERNS.some((p) => p.method === method && p.regex.test(path));
}

interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  timeout?: number;
}

export class ApolloClient implements IApolloClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private timeout: number;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? BASE_URL;
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.timeout = options.timeout ?? REQUEST_TIMEOUT;
  }

  async request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  }): Promise<T> {
    const url = new URL(this.baseUrl + options.path);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': `apollo-agent-cli/${VERSION}`,
    };

    let lastError: Error | undefined;
    const isWrite = options.method !== 'GET';
    const effectiveTimeout = isWrite ? Math.min(this.timeout, WRITE_TIMEOUT) : this.timeout;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

        const response = await fetch(url.toString(), {
          method: options.method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          if (!text) return undefined as T;
          return JSON.parse(text) as T;
        }

        const errorBody = await response.text().catch(() => '');
        let errorMessage: string;
        try {
          const parsed = JSON.parse(errorBody);
          errorMessage =
            parsed.message ||
            parsed.error ||
            (Array.isArray(parsed.messages) ? parsed.messages.join(', ') : null) ||
            errorBody;
        } catch {
          errorMessage = errorBody || response.statusText;
        }

        switch (response.status) {
          case 401:
            throw new AuthError(errorMessage || 'Invalid API key. Run: apollo login');
          case 403: {
            if (isMasterKeyEndpoint(options.method, options.path)) {
              throw new MasterKeyError(options.path);
            }
            throw new AuthError(errorMessage || 'Forbidden — check your API key permissions');
          }
          case 404:
            throw new NotFoundError(errorMessage);
          case 400:
          case 422:
            throw new ValidationError(errorMessage);
          case 429: {
            const retryAfter = parseInt(response.headers.get('retry-after') ?? '', 10);
            const err = new RateLimitError(
              errorMessage || 'Rate limit exceeded',
              isNaN(retryAfter) ? undefined : retryAfter,
            );
            if (attempt < this.maxRetries) {
              const delay = err.retryAfter
                ? err.retryAfter * 1000
                : Math.min(1000 * Math.pow(2, attempt), 10_000);
              await sleep(delay);
              lastError = err;
              continue;
            }
            throw err;
          }
          default:
            if (response.status >= 500) {
              const err = new ServerError(errorMessage, response.status);
              if (attempt < this.maxRetries) {
                await sleep(Math.min(1000 * Math.pow(2, attempt), 10_000));
                lastError = err;
                continue;
              }
              throw err;
            }
            throw new ApolloError(errorMessage, 'API_ERROR', response.status);
        }
      } catch (error) {
        if (error instanceof ApolloError) throw error;

        const isAbort =
          error instanceof Error &&
          (error.name === 'AbortError' || String(error.message).includes('aborted'));

        if (isAbort) {
          lastError = new ApolloError(
            `Request timed out after ${effectiveTimeout / 1000}s: ${options.method} ${options.path}`,
            'TIMEOUT',
          );
          if (!isWrite && attempt < this.maxRetries) {
            await sleep(Math.min(1000 * Math.pow(2, attempt), 10_000));
            continue;
          }
          throw lastError;
        }

        if (error instanceof TypeError && String(error.message).includes('fetch')) {
          throw new ApolloError(`Network error: ${error.message}`, 'NETWORK_ERROR');
        }

        throw error;
      }
    }

    throw lastError ?? new ApolloError('Request failed after retries', 'MAX_RETRIES');
  }

  async get<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query });
  }

  async post<T>(path: string, body?: unknown, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'POST', path, query, body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body });
  }

  async delete<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, query });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
