import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';

const program = new Command();

program
  .name('apollo')
  .description('CLI and MCP server for Apollo.io — prospect, enrich, and manage your pipeline')
  .version('0.1.0')
  .option('--api-key <key>', 'API key (overrides APOLLO_API_KEY env var and stored config)')
  .option('--output <format>', 'Output format: json (default), pretty, or table', 'json')
  .option('--pretty', 'Shorthand for --output pretty')
  .option('--quiet', 'Suppress output, exit codes only')
  .option('--fields <fields>', 'Comma-separated list of fields to include in output');

registerAllCommands(program);

program.parse();
