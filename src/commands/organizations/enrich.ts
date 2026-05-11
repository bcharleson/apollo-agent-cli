import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const organizationsEnrichCommand: CommandDefinition = {
  name: 'organizations_enrich',
  group: 'organizations',
  subcommand: 'enrich',
  description:
    'Enrich a company by domain. Returns firmographics, tech stack, headcount, and funding data. Consumes credits.',
  examples: [
    'apollo organizations enrich --domain apollo.io',
    'apollo organizations enrich --domain stripe.com --pretty',
  ],

  inputSchema: z.object({
    domain: z.string().describe('Company domain (e.g. apollo.io) — required'),
  }),

  cliMappings: {
    options: [
      { field: 'domain', flags: '--domain <domain>', description: 'Company domain (required)' },
    ],
  },

  endpoint: { method: 'GET', path: '/organizations/enrich' },

  fieldMappings: {
    domain: 'query',
  },

  handler: (input, client) => executeCommand(organizationsEnrichCommand, input, client),
};
