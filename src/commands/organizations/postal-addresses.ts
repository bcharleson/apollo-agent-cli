import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const organizationsPostalAddressesCommand: CommandDefinition = {
  name: 'organizations_postal_addresses',
  group: 'organizations',
  subcommand: 'postal-addresses',
  description:
    'Get registered postal addresses (HQ, regional offices) for an Apollo organization.',
  examples: [
    'apollo organizations postal-addresses <organization-id>',
    'apollo organizations postal-addresses <organization-id> --pretty',
  ],

  inputSchema: z.object({
    organization_id: z.string().describe('Apollo organization ID'),
  }),

  cliMappings: {
    args: [{ field: 'organization_id', name: 'organization-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/organizations/{organization_id}/postal_addresses' },

  fieldMappings: {
    organization_id: 'path',
  },

  handler: (input, client) => executeCommand(organizationsPostalAddressesCommand, input, client),
};
