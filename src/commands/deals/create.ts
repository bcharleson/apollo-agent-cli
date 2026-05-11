import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const dealsCreateCommand: CommandDefinition = {
  name: 'deals_create',
  group: 'deals',
  subcommand: 'create',
  description: 'Create a new deal (opportunity) in Apollo. Requires master API key.',
  examples: [
    'apollo deals create --name "Acme Q1 Deal" --account-id "acc_abc"',
    'apollo deals create --name "BigCo Contract" --account-id "acc_xyz" --amount 50000 --owner-id "user_123"',
  ],

  inputSchema: z.object({
    name: z.string().describe('Deal name'),
    account_id: z.string().describe('Associated Apollo account ID (required)'),
    amount: z.coerce.number().optional().describe('Deal value (numeric)'),
    owner_id: z.string().optional().describe('Apollo user ID of the deal owner'),
    opportunity_stage_id: z.string().optional().describe('Pipeline stage ID'),
    closed_date: z.string().optional().describe('Expected close date (YYYY-MM-DD)'),
  }),

  cliMappings: {
    options: [
      { field: 'name', flags: '--name <name>', description: 'Deal name (required)' },
      { field: 'account_id', flags: '--account-id <id>', description: 'Associated account ID (required)' },
      { field: 'amount', flags: '--amount <value>', description: 'Deal value' },
      { field: 'owner_id', flags: '--owner-id <id>', description: 'Owner user ID' },
      { field: 'opportunity_stage_id', flags: '--stage-id <id>', description: 'Pipeline stage ID' },
      { field: 'closed_date', flags: '--close-date <date>', description: 'Expected close date (YYYY-MM-DD)' },
    ],
  },

  endpoint: { method: 'POST', path: '/opportunities' },

  fieldMappings: {
    name: 'body',
    account_id: 'body',
    amount: 'body',
    owner_id: 'body',
    opportunity_stage_id: 'body',
    closed_date: 'body',
  },

  handler: (input, client) => executeCommand(dealsCreateCommand, input, client),
};
