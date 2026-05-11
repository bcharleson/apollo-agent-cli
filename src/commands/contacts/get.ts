import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const contactsGetCommand: CommandDefinition = {
  name: 'contacts_get',
  group: 'contacts',
  subcommand: 'get',
  description:
    'Get a single contact in your Apollo CRM by contact ID. Returns full contact record including custom fields, labels, and stage.',
  examples: ['apollo contacts get <contact-id>', 'apollo contacts get <contact-id> --pretty'],

  inputSchema: z.object({
    contact_id: z.string().describe('Apollo contact ID'),
  }),

  cliMappings: {
    args: [{ field: 'contact_id', name: 'contact-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/contacts/{contact_id}' },

  fieldMappings: {
    contact_id: 'path',
  },

  handler: (input, client) => executeCommand(contactsGetCommand, input, client),
};
