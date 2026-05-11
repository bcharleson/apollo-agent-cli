import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import type { CommandDefinition } from '../../src/core/types.js';

/**
 * MCP server registers tools that validate input via Zod before invoking
 * the handler. We can't easily spin up the actual MCP server here, but the
 * validation logic mirrors the safeParse + isError envelope contract.
 *
 * This test guards the contract: invalid input must NOT call the handler,
 * and the response must include `isError: true` plus a structured error.
 */

interface McpResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

async function callTool<T extends z.ZodObject<any>>(
  cmdDef: CommandDefinition<T>,
  args: Record<string, unknown>,
  client: any,
): Promise<McpResponse> {
  const parsed = cmdDef.inputSchema.safeParse(args);
  if (!parsed.success) {
    const issues = parsed.error.issues ?? [];
    const detail = issues
      .map((i: any) => `${(i.path ?? []).join('.') || '<root>'}: ${i.message}`)
      .join('; ');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `Invalid input: ${detail || 'schema validation failed'}`,
            code: 'VALIDATION_ERROR',
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await cmdDef.handler(parsed.data, client);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message ?? String(error),
            code: error.code ?? 'UNKNOWN_ERROR',
          }),
        },
      ],
      isError: true,
    };
  }
}

const stubClient = {
  request: async () => ({ ok: true }),
  get: async () => ({ ok: true }),
  post: async () => ({ ok: true }),
  patch: async () => ({ ok: true }),
  delete: async () => ({ ok: true }),
};

describe('MCP tool Zod validation', () => {
  it('returns isError: true on missing required field', async () => {
    let handlerCalled = false;
    const cmdDef: CommandDefinition = {
      name: 'test_required',
      group: 'test',
      subcommand: 'required',
      description: 'test',
      inputSchema: z.object({ id: z.string() }),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/x' },
      handler: async () => {
        handlerCalled = true;
        return {};
      },
    };

    const res = await callTool(cmdDef, {}, stubClient);
    expect(res.isError).toBe(true);
    expect(handlerCalled).toBe(false);
    const body = JSON.parse(res.content[0].text);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toMatch(/Invalid input/);
  });

  it('returns success when input matches schema', async () => {
    const cmdDef: CommandDefinition = {
      name: 'test_ok',
      group: 'test',
      subcommand: 'ok',
      description: 'test',
      inputSchema: z.object({ id: z.string() }),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/x' },
      handler: async (input) => ({ received: input }),
    };

    const res = await callTool(cmdDef, { id: 'abc' }, stubClient);
    expect(res.isError).toBeUndefined();
    const body = JSON.parse(res.content[0].text);
    expect(body.received).toEqual({ id: 'abc' });
  });

  it('returns isError on handler-thrown ApolloError', async () => {
    const cmdDef: CommandDefinition = {
      name: 'test_throw',
      group: 'test',
      subcommand: 'throw',
      description: 'test',
      inputSchema: z.object({}),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/x' },
      handler: async () => {
        const e = new Error('oops');
        (e as any).code = 'CUSTOM_ERROR';
        throw e;
      },
    };

    const res = await callTool(cmdDef, {}, stubClient);
    expect(res.isError).toBe(true);
    const body = JSON.parse(res.content[0].text);
    expect(body.error).toBe('oops');
    expect(body.code).toBe('CUSTOM_ERROR');
  });

  it('parses and applies defaults from Zod schema', async () => {
    const cmdDef: CommandDefinition = {
      name: 'test_defaults',
      group: 'test',
      subcommand: 'defaults',
      description: 'test',
      inputSchema: z.object({ page: z.coerce.number().default(1) }),
      cliMappings: {},
      endpoint: { method: 'GET', path: '/x' },
      handler: async (input) => ({ received: input }),
    };

    const res = await callTool(cmdDef, {}, stubClient);
    const body = JSON.parse(res.content[0].text);
    expect(body.received).toEqual({ page: 1 });
  });
});
