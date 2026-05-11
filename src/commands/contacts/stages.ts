import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const contactsStagesCommand: CommandDefinition = {
  name: 'contacts_stages',
  group: 'contacts',
  subcommand: 'stages',
  description:
    'List all contact stages configured in your Apollo workspace. Use the returned IDs for "contacts update-stages --stage-id".',
  examples: ['apollo contacts stages', 'apollo contacts stages --fields id,display_name'],

  inputSchema: z.object({}),

  cliMappings: {},

  endpoint: { method: 'GET', path: '/contact_stages' },

  fieldMappings: {},

  handler: (input, client) => executeCommand(contactsStagesCommand, input, client),
};
