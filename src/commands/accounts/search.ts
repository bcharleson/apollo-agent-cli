import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const accountsSearchCommand: CommandDefinition = {
  name: 'accounts_search',
  group: 'accounts',
  subcommand: 'search',
  description: 'Search accounts (companies) in your Apollo CRM. Returns up to 50K records with pagination.',
  examples: [
    'apollo accounts search --limit 50',
    'apollo accounts search --q-keywords "SaaS" --page 2',
  ],

  inputSchema: z.object({
    q_keywords: z.string().optional().describe('Keyword search across account name, domain, and description'),
    page: z.coerce.number().min(1).default(1).describe('Page number (1-indexed)'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page (1-100)'),
    sort_by_field: z.string().optional().describe('Field to sort by'),
    sort_ascending: z.boolean().optional().describe('Sort ascending (default: descending)'),
  }),

  cliMappings: {
    options: [
      { field: 'q_keywords', flags: '--q-keywords <text>', description: 'Keyword search' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (default: 25)' },
      { field: 'sort_by_field', flags: '--sort-by <field>', description: 'Sort field' },
      { field: 'sort_ascending', flags: '--sort-asc', description: 'Sort ascending' },
    ],
  },

  endpoint: { method: 'POST', path: '/accounts/search' },

  fieldMappings: {
    q_keywords: 'body',
    page: 'body',
    per_page: 'body',
    sort_by_field: 'body',
    sort_ascending: 'body',
  },

  paginated: true,

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const body: Record<string, any> = { page: input.page, per_page: input.per_page };
    if (input.q_keywords) body.q_keywords = input.q_keywords;
    if (input.sort_by_field) body.sort_by_field = input.sort_by_field;
    if (input.sort_ascending !== undefined) body.sort_ascending = input.sort_ascending;
    return client.post('/accounts/search', body);
  },
};
