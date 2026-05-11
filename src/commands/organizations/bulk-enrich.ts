import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const organizationsBulkEnrichCommand: CommandDefinition = {
  name: 'organizations_bulk_enrich',
  group: 'organizations',
  subcommand: 'bulk-enrich',
  description: 'Bulk enrich up to 10 companies by domain or name. Consumes credits per match.',
  examples: [
    'apollo organizations bulk-enrich --domains "apollo.io,salesforce.com,hubspot.com"',
  ],

  inputSchema: z.object({
    domains: z.string().optional().describe('Comma-separated company domains (up to 10)'),
    names: z.string().optional().describe('Comma-separated company names (up to 10)'),
  }),

  cliMappings: {
    options: [
      { field: 'domains', flags: '--domains <domains>', description: 'Comma-separated domains (up to 10)' },
      { field: 'names', flags: '--names <names>', description: 'Comma-separated company names (up to 10)' },
    ],
  },

  endpoint: { method: 'POST', path: '/organizations/bulk_enrich' },

  fieldMappings: {
    domains: 'body',
    names: 'body',
  },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const domains = input.domains
      ? input.domains.split(',').map((d: string) => d.trim()).slice(0, 10)
      : undefined;
    const names = input.names
      ? input.names.split(',').map((n: string) => n.trim()).slice(0, 10)
      : undefined;

    if (!domains && !names) {
      throw new Error('Provide --domains or --names');
    }

    const details: Record<string, string>[] = [];
    if (domains) {
      for (const domain of domains) details.push({ domain });
    } else if (names) {
      for (const organization_name of names) details.push({ organization_name });
    }

    return client.post('/organizations/bulk_enrich', { details });
  },
};
