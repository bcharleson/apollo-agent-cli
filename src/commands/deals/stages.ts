import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const dealsStagesCommand: CommandDefinition = {
  name: 'deals_stages',
  group: 'deals',
  subcommand: 'stages',
  description:
    'List all pipeline stages (opportunity stages) configured in your Apollo workspace. Use the returned IDs for "deals create" and "deals update --stage-id". Requires master API key.',
  examples: ['apollo deals stages', 'apollo deals stages --fields id,display_name'],

  inputSchema: z.object({}),

  cliMappings: {},

  endpoint: { method: 'GET', path: '/opportunity_stages' },

  fieldMappings: {},

  handler: (input, client) => executeCommand(dealsStagesCommand, input, client),
};
