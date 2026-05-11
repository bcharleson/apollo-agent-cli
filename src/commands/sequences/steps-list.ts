import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const sequencesStepsListCommand: CommandDefinition = {
  name: 'sequences_steps_list',
  group: 'sequences',
  subcommand: 'steps-list',
  description:
    'List the email steps configured for an Apollo sequence. Each step has its own delay, subject, and body template. Requires master API key.',
  examples: [
    'apollo sequences steps-list <sequence-id>',
    'apollo sequences steps-list <sequence-id> --pretty',
  ],

  inputSchema: z.object({
    emailer_campaign_id: z.string().describe('Apollo sequence (emailer_campaign) ID'),
  }),

  cliMappings: {
    args: [{ field: 'emailer_campaign_id', name: 'sequence-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/emailer_campaigns/{emailer_campaign_id}/emailer_steps' },

  fieldMappings: {
    emailer_campaign_id: 'path',
  },

  handler: (input, client) => executeCommand(sequencesStepsListCommand, input, client),
};
