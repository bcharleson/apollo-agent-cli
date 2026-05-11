import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApolloClient } from '../../src/core/client.js';
import {
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  ApolloError,
  MasterKeyError,
} from '../../src/core/errors.js';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `HTTP ${status}`,
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe('ApolloClient — error handling', () => {
  it('returns parsed JSON on 200', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { id: 'u_1', name: 'Alice' }));
    const client = new ApolloClient({ apiKey: 'k' });
    const result = await client.get<{ id: string }>('/users/search');
    expect(result).toEqual({ id: 'u_1', name: 'Alice' });
  });

  it('sends x-api-key header (NOT Bearer)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {}));
    const client = new ApolloClient({ apiKey: 'secret-key' });
    await client.get('/users/search');
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['x-api-key']).toBe('secret-key');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('throws AuthError on 401', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }));
    const client = new ApolloClient({ apiKey: 'bad' });
    await expect(client.get('/users/search')).rejects.toBeInstanceOf(AuthError);
  });

  it('throws MasterKeyError on 403 for master-key endpoint', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(403, { error: 'forbidden' }));
    const client = new ApolloClient({ apiKey: 'k' });
    await expect(client.post('/opportunities', {})).rejects.toBeInstanceOf(MasterKeyError);
  });

  it('throws AuthError on 403 for non-master-key endpoint', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(403, { error: 'forbidden' }));
    const client = new ApolloClient({ apiKey: 'k' });
    const err = await client.post('/accounts/search', {}).catch((e) => e);
    expect(err).toBeInstanceOf(AuthError);
    expect(err).not.toBeInstanceOf(MasterKeyError);
  });

  it('throws NotFoundError on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(404, { error: 'not found' }));
    const client = new ApolloClient({ apiKey: 'k' });
    await expect(client.get('/contacts/missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ValidationError on 422', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(422, { messages: ['email required'] }));
    const client = new ApolloClient({ apiKey: 'k' });
    const err = await client.post('/contacts', {}).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.message).toContain('email required');
  });

  it('retries on 429 then succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(429, { error: 'rate limit' }, { 'retry-after': '0' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const client = new ApolloClient({ apiKey: 'k', maxRetries: 1 });
    const result = await client.get<{ ok: boolean }>('/contacts/search');
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws RateLimitError after retries exhausted', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(429, { error: 'rate limit' }, { 'retry-after': '0' }),
    );
    const client = new ApolloClient({ apiKey: 'k', maxRetries: 1 });
    await expect(client.get('/contacts/search')).rejects.toBeInstanceOf(RateLimitError);
  });

  it('retries on 5xx then throws ServerError', async () => {
    mockFetch.mockResolvedValue(jsonResponse(503, 'Service Unavailable'));
    const client = new ApolloClient({ apiKey: 'k', maxRetries: 1 });
    const err = await client.get('/contacts/search').catch((e) => e);
    expect(err).toBeInstanceOf(ServerError);
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('throws ApolloError with TIMEOUT code on aborted fetch', async () => {
    mockFetch.mockImplementationOnce(() => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    });
    const client = new ApolloClient({ apiKey: 'k', maxRetries: 0, timeout: 1 });
    const err = await client.post('/contacts', {}).catch((e) => e);
    expect(err).toBeInstanceOf(ApolloError);
    expect((err as ApolloError).code).toBe('TIMEOUT');
  });

  it('does NOT retry write methods on timeout', async () => {
    mockFetch.mockImplementation(() => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    });
    const client = new ApolloClient({ apiKey: 'k', maxRetries: 3 });
    await client.post('/contacts', {}).catch(() => {});
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries idempotent GETs on timeout', async () => {
    mockFetch
      .mockImplementationOnce(() => {
        const e = new Error('aborted');
        e.name = 'AbortError';
        throw e;
      })
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const client = new ApolloClient({ apiKey: 'k', maxRetries: 1 });
    const result = await client.get<{ ok: boolean }>('/contacts/search');
    expect(result).toEqual({ ok: true });
  });

  it('encodes path templates without breaking master-key matcher', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(403, { error: 'forbidden' }));
    const client = new ApolloClient({ apiKey: 'k' });
    const err = await client
      .request({ method: 'GET', path: '/organizations/5e66b6381e05b40010101010' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(MasterKeyError);
  });

  it('serializes query params from request()', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {}));
    const client = new ApolloClient({ apiKey: 'k' });
    await client.request({
      method: 'GET',
      path: '/organizations/enrich',
      query: { domain: 'apollo.io', skip: undefined, empty: '' },
    });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('domain=apollo.io');
    expect(url).not.toContain('skip=');
    expect(url).not.toContain('empty=');
  });
});
