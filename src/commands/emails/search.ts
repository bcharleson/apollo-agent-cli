import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const emailsSearchCommand: CommandDefinition = {
  name: 'emails_search',
  group: 'emails',
  subcommand: 'search',
  description: 'Search outreach emails sent via sequences. Returns sent email records with open/click status. Requires master API key.',
  examples: [
    'apollo emails search',
    'apollo emails search --limit 50 --page 2',
    'apollo emails search --contact-id "contact_abc"',
  ],

  inputSchema: z.object({
    contact_id: z.string().optional().describe('Filter by contact ID'),
    emailer_campaign_id: z.string().optional().describe('Filter by sequence ID'),
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page'),
  }),

  cliMappings: {
    options: [
      { field: 'contact_id', flags: '--contact-id <id>', description: 'Filter by contact ID' },
      { field: 'emailer_campaign_id', flags: '--sequence-id <id>', description: 'Filter by sequence ID' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (default: 25)' },
    ],
  },

  endpoint: { method: 'GET', path: '/emailer_messages/search' },

  fieldMappings: {
    contact_id: 'query',
    emailer_campaign_id: 'query',
    page: 'query',
    per_page: 'query',
  },

  paginated: true,

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const query: Record<string, any> = { page: input.page, per_page: input.per_page };
    if (input.contact_id) query.contact_id = input.contact_id;
    if (input.emailer_campaign_id) query.emailer_campaign_id = input.emailer_campaign_id;
    return client.get('/emailer_messages/search', query);
  },
};
