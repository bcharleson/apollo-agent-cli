import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const dealsListCommand: CommandDefinition = {
  name: 'deals_list',
  group: 'deals',
  subcommand: 'list',
  description:
    'Search and list deals (opportunities) in your Apollo CRM. Filter by stage, owner, account, or keyword. Requires master API key.',
  examples: [
    'apollo deals list --limit 25',
    'apollo deals list --q-keywords "Q1" --stage-id "stage_abc"',
    'apollo deals list --owner-id "user_123" --sort-by amount',
  ],

  inputSchema: z.object({
    q_keywords: z.string().optional().describe('Free-text search across deal name, account, notes'),
    page: z.coerce.number().min(1).default(1).describe('Page number (1-indexed)'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page (1-100)'),
    opportunity_stage_id: z.string().optional().describe('Filter by pipeline stage ID'),
    owner_id: z.string().optional().describe('Filter by owner Apollo user ID'),
    account_id: z.string().optional().describe('Filter by associated account ID'),
    sort_by_field: z.string().optional().describe('Field to sort by (e.g. amount, created_at)'),
    sort_ascending: z.boolean().optional().describe('Sort ascending (default: descending)'),
  }),

  cliMappings: {
    options: [
      { field: 'q_keywords', flags: '--q-keywords <text>', description: 'Keyword search' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (1-100, default: 25)' },
      { field: 'opportunity_stage_id', flags: '--stage-id <id>', description: 'Pipeline stage ID' },
      { field: 'owner_id', flags: '--owner-id <id>', description: 'Owner user ID' },
      { field: 'account_id', flags: '--account-id <id>', description: 'Associated account ID' },
      { field: 'sort_by_field', flags: '--sort-by <field>', description: 'Sort field' },
      { field: 'sort_ascending', flags: '--sort-asc', description: 'Sort ascending' },
    ],
  },

  endpoint: { method: 'POST', path: '/opportunities/search' },

  paginated: true,

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const body: Record<string, any> = { page: input.page, per_page: input.per_page };
    if (input.q_keywords) body.q_keywords = input.q_keywords;
    if (input.opportunity_stage_id) body.opportunity_stage_id = input.opportunity_stage_id;
    if (input.owner_id) body.owner_id = input.owner_id;
    if (input.account_id) body.account_id = input.account_id;
    if (input.sort_by_field) body.sort_by_field = input.sort_by_field;
    if (input.sort_ascending !== undefined) body.sort_ascending = input.sort_ascending;
    return client.post('/opportunities/search', body);
  },
};
