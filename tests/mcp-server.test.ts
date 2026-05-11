import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { allCommands } from '../src/commands/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const mcpEntry = path.join(projectRoot, 'dist/mcp.js');

interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
}

/**
 * Spawn the MCP server, send the JSON-RPC frames, and collect responses
 * until we've received `expectedResponses` or hit a timeout.
 *
 * Tests the dist/mcp.js bundle (not source) so we catch any tsup-time issues.
 */
async function callMcpServer(
  frames: JsonRpcMessage[],
  expectedResponses: number,
  timeoutMs = 5000,
): Promise<JsonRpcMessage[]> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [mcpEntry], {
      env: { ...process.env, APOLLO_API_KEY: 'test-key-not-used-for-listing' },
    });

    let stdoutBuf = '';
    let stderrBuf = '';
    const responses: JsonRpcMessage[] = [];
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Timeout. stderr: ${stderrBuf} stdout: ${stdoutBuf}`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split('\n');
      stdoutBuf = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as JsonRpcMessage;
          responses.push(parsed);
          if (responses.length >= expectedResponses) {
            clearTimeout(timer);
            child.kill('SIGTERM');
            resolve(responses);
            return;
          }
        } catch {
          // ignore partial frames / non-JSON lines
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    for (const frame of frames) {
      child.stdin.write(JSON.stringify(frame) + '\n');
    }
  });
}

describe('MCP server (dist/mcp.js)', () => {
  it('initializes and reports the apollo server name', async () => {
    const responses = await callMcpServer(
      [
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'test', version: '0.0.0' },
          },
        },
      ],
      1,
    );

    expect(responses).toHaveLength(1);
    const result = responses[0].result as any;
    expect(result.serverInfo.name).toBe('apollo');
  }, 10_000);

  it('lists all 55 tools via tools/list', async () => {
    const responses = await callMcpServer(
      [
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'test', version: '0.0.0' },
          },
        },
        {
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        },
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
        },
      ],
      2,
    );

    const toolsListResponse = responses.find((r) => r.id === 2);
    expect(toolsListResponse).toBeDefined();
    const tools = (toolsListResponse?.result as any).tools as Array<{ name: string }>;
    expect(tools.length).toBe(allCommands.length);

    const toolNames = tools.map((t) => t.name).sort();
    const expectedNames = allCommands.map((c) => c.name).sort();
    expect(toolNames).toEqual(expectedNames);
  }, 10_000);

  it('returns an error response on a tool call with missing required input', async () => {
    // The MCP SDK runs its own pre-validation against the schema we register,
    // catching missing required fields before our handler runs. Either path
    // (SDK error or our handler's safeParse fallback) must produce isError.
    const responses = await callMcpServer(
      [
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'test', version: '0.0.0' },
          },
        },
        {
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        },
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'contacts_get',
            arguments: {}, // missing required contact_id
          },
        },
      ],
      2,
    );

    const callResponse = responses.find((r) => r.id === 2);
    expect(callResponse).toBeDefined();
    // Either: (a) a JSON-RPC error envelope, OR (b) result.isError with content
    const isProtocolError = callResponse?.error !== undefined;
    const isToolError = (callResponse?.result as any)?.isError === true;
    expect(isProtocolError || isToolError, 'expected error response').toBe(true);

    if (isToolError) {
      const text = (callResponse?.result as any).content[0].text as string;
      expect(text.toLowerCase()).toContain('contact_id');
    }
  }, 10_000);

  it('every registered tool has a non-empty description', async () => {
    const responses = await callMcpServer(
      [
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'test', version: '0.0.0' },
          },
        },
        {
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        },
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
        },
      ],
      2,
    );

    const toolsListResponse = responses.find((r) => r.id === 2);
    const tools = (toolsListResponse?.result as any).tools as Array<{
      name: string;
      description?: string;
    }>;

    for (const t of tools) {
      expect(t.description, `tool ${t.name} missing description`).toBeTruthy();
      expect((t.description ?? '').length).toBeGreaterThan(20);
    }
  }, 10_000);
});
