import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const callsSearchCommand: CommandDefinition = {
  name: 'calls_search',
  group: 'calls',
  subcommand: 'search',
  description: 'Search call records logged in Apollo. Requires master API key.',
  examples: [
    'apollo calls search',
    'apollo calls search --limit 50 --contact-id "contact_abc"',
  ],

  inputSchema: z.object({
    contact_id: z.string().optional().describe('Filter by contact ID'),
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page'),
  }),

  cliMappings: {
    options: [
      { field: 'contact_id', flags: '--contact-id <id>', description: 'Filter by contact ID' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (default: 25)' },
    ],
  },

  endpoint: { method: 'GET', path: '/phone_calls/search' },

  fieldMappings: {
    contact_id: 'query',
    page: 'query',
    per_page: 'query',
  },

  paginated: true,

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const query: Record<string, any> = { page: input.page, per_page: input.per_page };
    if (input.contact_id) query.contact_id = input.contact_id;
    return client.get('/phone_calls/search', query);
  },
};
