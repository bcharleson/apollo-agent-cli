import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const accountsStagesCommand: CommandDefinition = {
  name: 'accounts_stages',
  group: 'accounts',
  subcommand: 'stages',
  description:
    'List all account stages configured in your Apollo workspace. Use the returned IDs to filter "accounts search" results or to set stage on accounts.',
  examples: ['apollo accounts stages', 'apollo accounts stages --fields id,display_name'],

  inputSchema: z.object({}),

  cliMappings: {},

  endpoint: { method: 'GET', path: '/account_stages' },

  fieldMappings: {},

  handler: (input, client) => executeCommand(accountsStagesCommand, input, client),
};
