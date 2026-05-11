import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const sequencesDeactivateCommand: CommandDefinition = {
  name: 'sequences_deactivate',
  group: 'sequences',
  subcommand: 'deactivate',
  description:
    'Deactivate (unapprove) an active sequence. Stops sending without removing contacts. Pair with "sequences activate" to re-enable. Requires master API key.',
  examples: ['apollo sequences deactivate <sequence-id>'],

  inputSchema: z.object({
    emailer_campaign_id: z.string().describe('Apollo sequence (emailer_campaign) ID'),
  }),

  cliMappings: {
    args: [{ field: 'emailer_campaign_id', name: 'sequence-id', required: true }],
  },

  endpoint: { method: 'POST', path: '/emailer_campaigns/{emailer_campaign_id}/unapprove' },

  fieldMappings: {
    emailer_campaign_id: 'path',
  },

  handler: (input, client) => executeCommand(sequencesDeactivateCommand, input, client),
};
