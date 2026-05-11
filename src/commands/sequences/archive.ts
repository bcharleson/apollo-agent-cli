import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const sequencesArchiveCommand: CommandDefinition = {
  name: 'sequences_archive',
  group: 'sequences',
  subcommand: 'archive',
  description:
    'Archive an Apollo sequence. Removes it from the active sequences list. Requires master API key.',
  examples: ['apollo sequences archive <sequence-id>'],

  inputSchema: z.object({
    emailer_campaign_id: z.string().describe('Apollo sequence (emailer_campaign) ID'),
  }),

  cliMappings: {
    args: [{ field: 'emailer_campaign_id', name: 'sequence-id', required: true }],
  },

  endpoint: { method: 'POST', path: '/emailer_campaigns/{emailer_campaign_id}/archive' },

  fieldMappings: {
    emailer_campaign_id: 'path',
  },

  handler: (input, client) => executeCommand(sequencesArchiveCommand, input, client),
};
