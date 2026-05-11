import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const sequencesGetCommand: CommandDefinition = {
  name: 'sequences_get',
  group: 'sequences',
  subcommand: 'get',
  description:
    'Get a single Apollo sequence (emailer_campaign) by sequence ID. Returns full sequence record including settings and stats. Requires master API key.',
  examples: ['apollo sequences get <sequence-id>', 'apollo sequences get <sequence-id> --pretty'],

  inputSchema: z.object({
    emailer_campaign_id: z.string().describe('Apollo sequence (emailer_campaign) ID'),
  }),

  cliMappings: {
    args: [{ field: 'emailer_campaign_id', name: 'sequence-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/emailer_campaigns/{emailer_campaign_id}' },

  fieldMappings: {
    emailer_campaign_id: 'path',
  },

  handler: (input, client) => executeCommand(sequencesGetCommand, input, client),
};
