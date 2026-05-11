import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const sequencesAddContactsCommand: CommandDefinition = {
  name: 'sequences_add_contacts',
  group: 'sequences',
  subcommand: 'add-contacts',
  description: 'Add contacts to an Apollo sequence by sequence ID. Only CRM contacts (not raw prospects) can be added. Requires master API key.',
  examples: [
    'apollo sequences add-contacts <sequence-id> --contact-ids "id1,id2,id3"',
    'apollo sequences add-contacts <sequence-id> --contact-ids "id1" --email-account-id "inbox_id"',
  ],

  inputSchema: z.object({
    sequence_id: z.string().describe('Apollo sequence (emailer_campaign) ID'),
    contact_ids: z.string().describe('Comma-separated contact IDs to add'),
    email_account_id: z.string().optional().describe('Sending email account ID (from "apollo email-accounts list")'),
    sequence_no: z.coerce.number().optional().describe('Which step to start contacts at (default: first step)'),
  }),

  cliMappings: {
    args: [{ field: 'sequence_id', name: 'sequence-id', required: true }],
    options: [
      { field: 'contact_ids', flags: '--contact-ids <ids>', description: 'Contact IDs (comma-separated)' },
      { field: 'email_account_id', flags: '--email-account-id <id>', description: 'Sending inbox ID' },
      { field: 'sequence_no', flags: '--step <number>', description: 'Starting step number' },
    ],
  },

  endpoint: { method: 'POST', path: '/emailer_campaigns/{sequence_id}/add_contact_ids' },

  fieldMappings: {
    sequence_id: 'path',
    contact_ids: 'body',
    email_account_id: 'body',
    sequence_no: 'body',
  },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const body: Record<string, any> = {
      contact_ids: input.contact_ids.split(',').map((s: string) => s.trim()),
    };
    if (input.email_account_id) body.email_account_id = input.email_account_id;
    if (input.sequence_no !== undefined) body.sequence_no = input.sequence_no;
    return client.post(`/emailer_campaigns/${encodeURIComponent(String(input.sequence_id))}/add_contact_ids`, body);
  },
};
