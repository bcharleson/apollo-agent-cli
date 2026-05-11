import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const organizationsNewsCommand: CommandDefinition = {
  name: 'organizations_news',
  group: 'organizations',
  subcommand: 'news',
  description:
    'Get recent news articles for an Apollo organization. Useful as an intent / outreach personalization signal.',
  examples: [
    'apollo organizations news <organization-id>',
    'apollo organizations news <organization-id> --limit 10 --pretty',
  ],

  inputSchema: z.object({
    organization_id: z.string().describe('Apollo organization ID'),
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page'),
  }),

  cliMappings: {
    args: [{ field: 'organization_id', name: 'organization-id', required: true }],
    options: [
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (default: 25)' },
    ],
  },

  endpoint: { method: 'GET', path: '/organizations/{organization_id}/news_articles' },

  fieldMappings: {
    organization_id: 'path',
    page: 'query',
    per_page: 'query',
  },

  handler: (input, client) => executeCommand(organizationsNewsCommand, input, client),
};
