import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const accountsBulkUpdateCommand: CommandDefinition = {
  name: 'accounts_bulk_update',
  group: 'accounts',
  subcommand: 'bulk-update',
  description:
    'Bulk update multiple accounts in your Apollo CRM. Each item must include "id" and the fields to change. Requires master API key.',
  examples: [
    'apollo accounts bulk-update --accounts \'[{"id":"a1","name":"Acme"},{"id":"a2","name":"Beta"}]\'',
  ],

  inputSchema: z.object({
    accounts_json: z
      .string()
      .describe('JSON array of account updates: each item needs "id" plus fields to change'),
  }),

  cliMappings: {
    options: [
      {
        field: 'accounts_json',
        flags: '--accounts <json>',
        description: 'JSON array of account updates (max 100)',
      },
    ],
  },

  endpoint: { method: 'POST', path: '/accounts/bulk_update' },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    let accounts: any[];
    try {
      accounts = JSON.parse(input.accounts_json);
    } catch {
      throw new Error('--accounts must be valid JSON array');
    }
    if (!Array.isArray(accounts)) {
      throw new Error('--accounts must be a JSON array');
    }
    if (accounts.length === 0) {
      throw new Error('--accounts array must not be empty');
    }
    if (accounts.length > 100) {
      throw new Error('Maximum 100 accounts per bulk update request');
    }
    for (const a of accounts) {
      if (!a || typeof a !== 'object' || !a.id) {
        throw new Error('Each account in --accounts must have an "id" field');
      }
    }
    return client.post('/accounts/bulk_update', { accounts });
  },
};
