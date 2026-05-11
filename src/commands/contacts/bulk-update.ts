import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { UserInputError } from '../../core/errors.js';

export const contactsBulkUpdateCommand: CommandDefinition = {
  name: 'contacts_bulk_update',
  group: 'contacts',
  subcommand: 'bulk-update',
  description:
    'Bulk update multiple contacts in your Apollo CRM by passing a JSON array. Each item must include "id" and the fields to update. Requires master API key.',
  examples: [
    'apollo contacts bulk-update --contacts \'[{"id":"c1","title":"VP"},{"id":"c2","title":"CTO"}]\'',
  ],

  inputSchema: z.object({
    contacts_json: z
      .string()
      .describe('JSON array of contact updates: each item needs "id" plus fields to change'),
  }),

  cliMappings: {
    options: [
      {
        field: 'contacts_json',
        flags: '--contacts <json>',
        description: 'JSON array of contact updates (max 100)',
      },
    ],
  },

  endpoint: { method: 'POST', path: '/contacts/bulk_update' },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    let contacts: any[];
    try {
      contacts = JSON.parse(input.contacts_json);
    } catch {
      throw new UserInputError('--contacts must be valid JSON array');
    }
    if (!Array.isArray(contacts)) {
      throw new UserInputError('--contacts must be a JSON array');
    }
    if (contacts.length === 0) {
      throw new UserInputError('--contacts array must not be empty');
    }
    if (contacts.length > 100) {
      throw new UserInputError('Maximum 100 contacts per bulk update request');
    }
    for (const c of contacts) {
      if (!c || typeof c !== 'object' || !c.id) {
        throw new UserInputError('Each contact in --contacts must have an "id" field');
      }
    }
    return client.post('/contacts/bulk_update', { contacts });
  },
};
