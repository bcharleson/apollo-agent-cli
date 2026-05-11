import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const dealsGetCommand: CommandDefinition = {
  name: 'deals_get',
  group: 'deals',
  subcommand: 'get',
  description:
    'Get a single deal (opportunity) by Apollo deal ID. Returns full record including stage, amount, owner, and custom fields. Requires master API key.',
  examples: ['apollo deals get <deal-id>', 'apollo deals get <deal-id> --pretty'],

  inputSchema: z.object({
    opportunity_id: z.string().describe('Apollo deal/opportunity ID'),
  }),

  cliMappings: {
    args: [{ field: 'opportunity_id', name: 'deal-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/opportunities/{opportunity_id}' },

  fieldMappings: {
    opportunity_id: 'path',
  },

  handler: (input, client) => executeCommand(dealsGetCommand, input, client),
};
