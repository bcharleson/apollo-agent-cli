import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const organizationsJobPostingsCommand: CommandDefinition = {
  name: 'organizations_job_postings',
  group: 'organizations',
  subcommand: 'job-postings',
  description: 'Get open job postings for an organization. Useful for intent signals — hiring for sales/marketing indicates growth. Consumes credits.',
  examples: [
    'apollo organizations job-postings <organization-id>',
    'apollo organizations job-postings <organization-id> --limit 20',
  ],

  inputSchema: z.object({
    organization_id: z.string().describe('Apollo organization ID'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page'),
    page: z.coerce.number().min(1).default(1).describe('Page number'),
  }),

  cliMappings: {
    args: [{ field: 'organization_id', name: 'organization-id', required: true }],
    options: [
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (default: 25)' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
    ],
  },

  endpoint: { method: 'GET', path: '/organizations/{organization_id}/job_postings' },

  fieldMappings: {
    organization_id: 'path',
    per_page: 'query',
    page: 'query',
  },

  handler: (input, client) => executeCommand(organizationsJobPostingsCommand, input, client),
};
