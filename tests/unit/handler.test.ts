import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { executeCommand } from '../../src/core/handler.js';
import type { CommandDefinition } from '../../src/core/types.js';

function makeStubClient() {
  const request = vi.fn(async () => ({ ok: true }));
  const client: any = { request, get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
  return { client, request };
}

describe('executeCommand()', () => {
  it('substitutes path-mapped fields into the URL', async () => {
    const cmd: CommandDefinition = {
      name: 'contacts_get',
      group: 'contacts',
      subcommand: 'get',
      description: 'test',
      inputSchema: z.object({ contact_id: z.string() }),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/contacts/{contact_id}' },
      fieldMappings: { contact_id: 'path' },
      handler: async () => ({}),
    };
    const { client, request } = makeStubClient();
    await executeCommand(cmd, { contact_id: 'abc' }, client);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/contacts/abc' }),
    );
  });

  it('URL-encodes path parameters', async () => {
    const cmd: CommandDefinition = {
      name: 'contacts_get',
      group: 'contacts',
      subcommand: 'get',
      description: 'test',
      inputSchema: z.object({ contact_id: z.string() }),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/contacts/{contact_id}' },
      fieldMappings: { contact_id: 'path' },
      handler: async () => ({}),
    };
    const { client, request } = makeStubClient();
    await executeCommand(cmd, { contact_id: 'spaces and / slashes' }, client);

    const args = request.mock.calls[0][0];
    expect(args.path).toBe('/contacts/spaces%20and%20%2F%20slashes');
  });

  it('routes fields to query params', async () => {
    const cmd: CommandDefinition = {
      name: 'orgs_enrich',
      group: 'organizations',
      subcommand: 'enrich',
      description: 'test',
      inputSchema: z.object({ domain: z.string() }),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/organizations/enrich' },
      fieldMappings: { domain: 'query' },
      handler: async () => ({}),
    };
    const { client, request } = makeStubClient();
    await executeCommand(cmd, { domain: 'apollo.io' }, client);

    expect(request.mock.calls[0][0].query).toEqual({ domain: 'apollo.io' });
    expect(request.mock.calls[0][0].body).toBeUndefined();
  });

  it('routes fields to body', async () => {
    const cmd: CommandDefinition = {
      name: 'contacts_create',
      group: 'contacts',
      subcommand: 'create',
      description: 'test',
      inputSchema: z.object({ first_name: z.string(), last_name: z.string() }),
      cliMappings: {},
      endpoint: { method: 'POST', path: '/contacts' },
      fieldMappings: { first_name: 'body', last_name: 'body' },
      handler: async () => ({}),
    };
    const { client, request } = makeStubClient();
    await executeCommand(cmd, { first_name: 'A', last_name: 'B' }, client);

    expect(request.mock.calls[0][0].body).toEqual({ first_name: 'A', last_name: 'B' });
    expect(request.mock.calls[0][0].query).toBeUndefined();
  });

  it('omits undefined fields from query and body', async () => {
    const cmd: CommandDefinition = {
      name: 'contacts_search',
      group: 'contacts',
      subcommand: 'search',
      description: 'test',
      inputSchema: z.object({ q: z.string().optional(), page: z.number().optional() }),
      cliMappings: {},
      endpoint: { method: 'POST', path: '/contacts/search' },
      fieldMappings: { q: 'body', page: 'body' },
      handler: async () => ({}),
    };
    const { client, request } = makeStubClient();
    await executeCommand(cmd, { q: 'foo' }, client);

    expect(request.mock.calls[0][0].body).toEqual({ q: 'foo' });
    expect(request.mock.calls[0][0].body).not.toHaveProperty('page');
  });

  it('mixes path + query + body in one request', async () => {
    const cmd: CommandDefinition = {
      name: 'orgs_news',
      group: 'organizations',
      subcommand: 'news',
      description: 'test',
      inputSchema: z.object({ organization_id: z.string(), page: z.number(), filter: z.string() }),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/organizations/{organization_id}/news_articles' },
      fieldMappings: { organization_id: 'path', page: 'query', filter: 'body' },
      handler: async () => ({}),
    };
    const { client, request } = makeStubClient();
    await executeCommand(cmd, { organization_id: 'org1', page: 2, filter: 'tech' }, client);

    const args = request.mock.calls[0][0];
    expect(args.path).toBe('/organizations/org1/news_articles');
    expect(args.query).toEqual({ page: 2 });
    expect(args.body).toEqual({ filter: 'tech' });
  });

  it('throws when fieldMappings is missing', async () => {
    const cmd: CommandDefinition = {
      name: 'bad',
      group: 'bad',
      subcommand: 'bad',
      description: 'test',
      inputSchema: z.object({}),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/x' },
      handler: async () => ({}),
    };
    const { client } = makeStubClient();
    await expect(executeCommand(cmd, {}, client)).rejects.toThrow(/fieldMappings/);
  });

  it('handles an empty fieldMappings object (no path/query/body params)', async () => {
    const cmd: CommandDefinition = {
      name: 'labels_list',
      group: 'labels',
      subcommand: 'list',
      description: 'test',
      inputSchema: z.object({}),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/labels' },
      fieldMappings: {},
      handler: async () => ({}),
    };
    const { client, request } = makeStubClient();
    await executeCommand(cmd, {}, client);
    expect(request.mock.calls[0][0].path).toBe('/labels');
    expect(request.mock.calls[0][0].query).toBeUndefined();
    expect(request.mock.calls[0][0].body).toBeUndefined();
  });
});
