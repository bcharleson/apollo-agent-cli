import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const dealsUpdateCommand: CommandDefinition = {
  name: 'deals_update',
  group: 'deals',
  subcommand: 'update',
  description: 'Update an existing deal (opportunity) by ID. Requires master API key.',
  examples: [
    'apollo deals update <deal-id> --amount 75000',
    'apollo deals update <deal-id> --stage-id "stage_closed_won" --close-date "2026-03-31"',
  ],

  inputSchema: z.object({
    opportunity_id: z.string().describe('Apollo opportunity (deal) ID'),
    name: z.string().optional().describe('Deal name'),
    amount: z.coerce.number().optional().describe('Deal value'),
    owner_id: z.string().optional().describe('Owner user ID'),
    opportunity_stage_id: z.string().optional().describe('Pipeline stage ID'),
    closed_date: z.string().optional().describe('Expected close date (YYYY-MM-DD)'),
  }),

  cliMappings: {
    args: [{ field: 'opportunity_id', name: 'deal-id', required: true }],
    options: [
      { field: 'name', flags: '--name <name>', description: 'Deal name' },
      { field: 'amount', flags: '--amount <value>', description: 'Deal value' },
      { field: 'owner_id', flags: '--owner-id <id>', description: 'Owner user ID' },
      { field: 'opportunity_stage_id', flags: '--stage-id <id>', description: 'Pipeline stage ID' },
      { field: 'closed_date', flags: '--close-date <date>', description: 'Expected close date (YYYY-MM-DD)' },
    ],
  },

  endpoint: { method: 'PATCH', path: '/opportunities/{opportunity_id}' },

  fieldMappings: {
    opportunity_id: 'path',
    name: 'body',
    amount: 'body',
    owner_id: 'body',
    opportunity_stage_id: 'body',
    closed_date: 'body',
  },

  handler: (input, client) => executeCommand(dealsUpdateCommand, input, client),
};
