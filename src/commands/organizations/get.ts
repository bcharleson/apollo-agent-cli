import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const organizationsGetCommand: CommandDefinition = {
  name: 'organizations_get',
  group: 'organizations',
  subcommand: 'get',
  description: 'Get complete organization profile by Apollo organization ID. Returns deep firmographic data, tech stack, and funding. Requires master API key.',
  examples: [
    'apollo organizations get <organization-id>',
  ],

  inputSchema: z.object({
    organization_id: z.string().describe('Apollo organization ID'),
  }),

  cliMappings: {
    args: [{ field: 'organization_id', name: 'organization-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/organizations/{organization_id}' },

  fieldMappings: {
    organization_id: 'path',
  },

  handler: (input, client) => executeCommand(organizationsGetCommand, input, client),
};
