import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const usersListCommand: CommandDefinition = {
  name: 'users_list',
  group: 'users',
  subcommand: 'list',
  description: 'List all users (teammates) in your Apollo organization. Returns user IDs needed for assigning deals, tasks, and sequences. Requires master API key.',
  examples: [
    'apollo users list',
    'apollo users list --pretty',
    'apollo users list --fields id,name,email',
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

  endpoint: { method: 'GET', path: '/users/search' },

  fieldMappings: {
    page: 'query',
    per_page: 'query',
  },

  handler: (input, client) => executeCommand(usersListCommand, input, client),
};
