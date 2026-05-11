import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const accountsGetCommand: CommandDefinition = {
  name: 'accounts_get',
  group: 'accounts',
  subcommand: 'get',
  description:
    'Get a single account in your Apollo CRM by account ID. Returns full account record including custom fields, owner, and labels. Requires master API key.',
  examples: ['apollo accounts get <account-id>', 'apollo accounts get <account-id> --pretty'],

  inputSchema: z.object({
    account_id: z.string().describe('Apollo account ID'),
  }),

  cliMappings: {
    args: [{ field: 'account_id', name: 'account-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/accounts/{account_id}' },

  fieldMappings: {
    account_id: 'path',
  },

  handler: (input, client) => executeCommand(accountsGetCommand, input, client),
};
