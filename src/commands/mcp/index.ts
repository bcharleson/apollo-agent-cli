import { Command } from 'commander';

export function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start the Apollo MCP server (stdio transport)')
    .action(async () => {
      const { startMcpServer } = await import('../../mcp/server.js');
      process.on('SIGINT', () => process.exit(0));
      process.on('SIGTERM', () => process.exit(0));
      await startMcpServer();
    });
}
