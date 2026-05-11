import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const emailsActivitiesCommand: CommandDefinition = {
  name: 'emails_activities',
  group: 'emails',
  subcommand: 'activities',
  description: 'Get activity events (opens, clicks, bounces) for a specific sent email. Requires master API key.',
  examples: [
    'apollo emails activities <email-id>',
  ],

  inputSchema: z.object({
    email_id: z.string().describe('Apollo emailer_message ID'),
  }),

  cliMappings: {
    args: [{ field: 'email_id', name: 'email-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/emailer_messages/{email_id}/activities' },

  fieldMappings: {
    email_id: 'path',
  },

  handler: (input, client) => executeCommand(emailsActivitiesCommand, input, client),
};
