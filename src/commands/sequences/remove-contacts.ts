import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const sequencesRemoveContactsCommand: CommandDefinition = {
  name: 'sequences_remove_contacts',
  group: 'sequences',
  subcommand: 'remove-contacts',
  description: 'Remove or stop contacts from a sequence. Requires master API key.',
  examples: [
    'apollo sequences remove-contacts --contact-ids "id1,id2" --sequence-id "seq_abc"',
    'apollo sequences remove-contacts --contact-ids "id1" --sequence-id "seq_abc" --action finished',
  ],

  inputSchema: z.object({
    contact_ids: z.string().describe('Comma-separated contact IDs to remove'),
    emailer_campaign_id: z.string().describe('Sequence (emailer_campaign) ID'),
    action: z.enum(['remove', 'finished']).default('remove').describe('Action: remove (remove entirely) or finished (mark as done)'),
  }),

  cliMappings: {
    options: [
      { field: 'contact_ids', flags: '--contact-ids <ids>', description: 'Contact IDs (comma-separated)' },
      { field: 'emailer_campaign_id', flags: '--sequence-id <id>', description: 'Sequence ID' },
      { field: 'action', flags: '--action <action>', description: 'remove or finished (default: remove)' },
    ],
  },

  endpoint: { method: 'POST', path: '/emailer_campaigns/remove_or_stop_contact_ids' },

  fieldMappings: {
    contact_ids: 'body',
    emailer_campaign_id: 'body',
    action: 'body',
  },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    return client.post('/emailer_campaigns/remove_or_stop_contact_ids', {
      contact_ids: input.contact_ids.split(',').map((s: string) => s.trim()),
      emailer_campaign_id: input.emailer_campaign_id,
      action: input.action,
    });
  },
};
