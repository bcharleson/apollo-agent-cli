import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const sequencesActivateCommand: CommandDefinition = {
  name: 'sequences_activate',
  group: 'sequences',
  subcommand: 'activate',
  description: 'Activate (approve) a sequence so it starts sending. Sequence must have at least one step. Requires master API key.',
  examples: [
    'apollo sequences activate <sequence-id>',
  ],

  inputSchema: z.object({
    sequence_id: z.string().describe('Apollo sequence ID to activate'),
  }),

  cliMappings: {
    args: [{ field: 'sequence_id', name: 'sequence-id', required: true }],
  },

  endpoint: { method: 'POST', path: '/emailer_campaigns/{sequence_id}/approve' },

  fieldMappings: {
    sequence_id: 'path',
  },

  handler: (input, client) => executeCommand(sequencesActivateCommand, input, client),
};
