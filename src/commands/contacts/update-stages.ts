import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const contactsUpdateStagesCommand: CommandDefinition = {
  name: 'contacts_update_stages',
  group: 'contacts',
  subcommand: 'update-stages',
  description: 'Bulk update the contact stage for multiple contacts at once.',
  examples: [
    'apollo contacts update-stages --contact-ids "id1,id2,id3" --stage-id "stage_abc"',
  ],

  inputSchema: z.object({
    contact_ids: z.string().describe('Comma-separated contact IDs to update'),
    contact_stage_id: z.string().describe('Apollo contact stage ID to assign'),
  }),

  cliMappings: {
    options: [
      { field: 'contact_ids', flags: '--contact-ids <ids>', description: 'Contact IDs (comma-separated)' },
      { field: 'contact_stage_id', flags: '--stage-id <id>', description: 'Stage ID to assign' },
    ],
  },

  endpoint: { method: 'POST', path: '/contacts/update_stages' },

  fieldMappings: {
    contact_ids: 'body',
    contact_stage_id: 'body',
  },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    return client.post('/contacts/update_stages', {
      contact_ids: input.contact_ids.split(',').map((s: string) => s.trim()),
      contact_stage_id: input.contact_stage_id,
    });
  },
};
