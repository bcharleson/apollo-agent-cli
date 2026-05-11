import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const sequencesSearchCommand: CommandDefinition = {
  name: 'sequences_search',
  group: 'sequences',
  subcommand: 'search',
  description: 'Search email sequences (called emailer_campaigns in the API). Requires master API key.',
  examples: [
    'apollo sequences search',
    'apollo sequences search --limit 50',
    'apollo sequences search --q-keywords "Cold Outreach"',
  ],

  inputSchema: z.object({
    q_keywords: z.string().optional().describe('Search sequences by name'),
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page'),
  }),

  cliMappings: {
    options: [
      { field: 'q_keywords', flags: '--q-keywords <text>', description: 'Search by sequence name' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (default: 25)' },
    ],
  },

  endpoint: { method: 'POST', path: '/emailer_campaigns/search' },

  fieldMappings: {
    q_keywords: 'body',
    page: 'body',
    per_page: 'body',
  },

  paginated: true,

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const body: Record<string, any> = { page: input.page, per_page: input.per_page };
    if (input.q_keywords) body.q_keywords = input.q_keywords;
    return client.post('/emailer_campaigns/search', body);
  },
};
