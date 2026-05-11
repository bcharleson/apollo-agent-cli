import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const contactsSearchCommand: CommandDefinition = {
  name: 'contacts_search',
  group: 'contacts',
  subcommand: 'search',
  description: 'Search contacts in your Apollo CRM (people your team has added). Returns up to 50K records with pagination.',
  examples: [
    'apollo contacts search --limit 50',
    'apollo contacts search --q-keywords "VP Sales" --page 2',
    'apollo contacts search --contact-stage-ids "id1,id2"',
  ],

  inputSchema: z.object({
    q_keywords: z.string().optional().describe('Free-text search across name, email, title, company'),
    page: z.coerce.number().min(1).default(1).describe('Page number (1-indexed)'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page (1-100)'),
    contact_stage_ids: z.string().optional().describe('Comma-separated stage IDs to filter by'),
    sort_by_field: z.string().optional().describe('Field to sort by e.g. contact_last_activity_date'),
    sort_ascending: z.boolean().optional().describe('Sort ascending (default: descending)'),
  }),

  cliMappings: {
    options: [
      { field: 'q_keywords', flags: '--q-keywords <text>', description: 'Keyword search (name, email, title, company)' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (1-100, default: 25)' },
      { field: 'contact_stage_ids', flags: '--contact-stage-ids <ids>', description: 'Stage IDs (comma-separated)' },
      { field: 'sort_by_field', flags: '--sort-by <field>', description: 'Sort field' },
      { field: 'sort_ascending', flags: '--sort-asc', description: 'Sort ascending' },
    ],
  },

  endpoint: { method: 'POST', path: '/contacts/search' },

  fieldMappings: {
    q_keywords: 'body',
    page: 'body',
    per_page: 'body',
    contact_stage_ids: 'body',
    sort_by_field: 'body',
    sort_ascending: 'body',
  },

  paginated: true,

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const body: Record<string, any> = { page: input.page, per_page: input.per_page };
    if (input.q_keywords) body.q_keywords = input.q_keywords;
    if (input.contact_stage_ids) body.contact_stage_ids = input.contact_stage_ids.split(',').map((s: string) => s.trim());
    if (input.sort_by_field) body.sort_by_field = input.sort_by_field;
    if (input.sort_ascending !== undefined) body.sort_ascending = input.sort_ascending;
    return client.post('/contacts/search', body);
  },
};
