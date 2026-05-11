import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { allCommands } from '../commands/index.js';
import { resolveApiKey } from '../core/auth.js';
import { ApolloClient } from '../core/client.js';

export async function startMcpServer(): Promise<void> {
  const apiKey = await resolveApiKey();
  const client = new ApolloClient({ apiKey });

  const server = new McpServer({
    name: 'apollo',
    version: '0.1.0',
  });

  // Register every CommandDefinition as an MCP tool
  for (const cmdDef of allCommands) {
    const shape = cmdDef.inputSchema.shape;

    server.registerTool(
      cmdDef.name,
      {
        description: cmdDef.description,
        inputSchema: shape,
      },
      async (args: Record<string, unknown>) => {
        try {
          const parsed = cmdDef.inputSchema.safeParse(args);
          if (!parsed.success) {
            const issues = parsed.error.issues ?? [];
            const detail = issues
              .map((i: any) => `${(i.path ?? []).join('.') || '<root>'}: ${i.message}`)
              .join('; ');
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    error: `Invalid input: ${detail || 'schema validation failed'}`,
                    code: 'VALIDATION_ERROR',
                  }),
                },
              ],
              isError: true,
            };
          }

          const result = await cmdDef.handler(parsed.data, client);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  error: error.message ?? String(error),
                  code: error.code ?? 'UNKNOWN_ERROR',
                }),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error('Apollo MCP server started. Tools registered:', allCommands.length);
}
