import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { UserInputError } from '../../core/errors.js';

export const accountsBulkCreateCommand: CommandDefinition = {
  name: 'accounts_bulk_create',
  group: 'accounts',
  subcommand: 'bulk-create',
  description: 'Bulk create up to 100 accounts from a JSON array. Returns newly_created and existing_accounts. Does not update existing records.',
  examples: [
    'apollo accounts bulk-create --accounts \'[{"name":"Acme","domain":"acme.com"},{"name":"Beta Co","domain":"beta.com"}]\'',
  ],

  inputSchema: z.object({
    accounts_json: z.string().describe('JSON array of account objects with name and optional domain'),
  }),

  cliMappings: {
    options: [
      { field: 'accounts_json', flags: '--accounts <json>', description: 'JSON array of account objects (max 100)' },
    ],
  },

  endpoint: { method: 'POST', path: '/accounts/bulk_create' },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    let accounts: any[];
    try {
      accounts = JSON.parse(input.accounts_json);
    } catch {
      throw new UserInputError('--accounts must be valid JSON array');
    }
    if (!Array.isArray(accounts)) {
      throw new UserInputError('--accounts must be a JSON array');
    }
    if (accounts.length > 100) {
      throw new UserInputError('Maximum 100 accounts per bulk create request');
    }
    return client.post('/accounts/bulk_create', { accounts });
  },
};
