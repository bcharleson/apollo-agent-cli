import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const emailAccountsListCommand: CommandDefinition = {
  name: 'email_accounts_list',
  group: 'email-accounts',
  subcommand: 'list',
  description: 'List all connected sending email accounts (inboxes). Returns account IDs needed when adding contacts to sequences. Requires master API key.',
  examples: [
    'apollo email-accounts list',
    'apollo email-accounts list --fields id,email,name',
  ],

  inputSchema: z.object({
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    per_page: z.coerce.number().min(1).max(100).default(100).describe('Results per page'),
  }),

  cliMappings: {
    options: [
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (default: 100)' },
    ],
  },

  endpoint: { method: 'GET', path: '/email_accounts' },

  fieldMappings: {
    page: 'query',
    per_page: 'query',
  },

  handler: (input, client) => executeCommand(emailAccountsListCommand, input, client),
};
