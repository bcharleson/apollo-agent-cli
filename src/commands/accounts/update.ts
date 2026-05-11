import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const accountsUpdateCommand: CommandDefinition = {
  name: 'accounts_update',
  group: 'accounts',
  subcommand: 'update',
  description: 'Update an account in your Apollo CRM by account ID. Requires a master API key.',
  examples: [
    'apollo accounts update <account-id> --name "Acme Corporation"',
    'apollo accounts update <account-id> --phone "+1-555-0100" --address "123 Main St, SF, CA"',
  ],

  inputSchema: z.object({
    account_id: z.string().describe('Apollo account ID'),
    name: z.string().optional().describe('Company name'),
    domain: z.string().optional().describe('Company domain'),
    phone_number: z.string().optional().describe('Phone number'),
    raw_address: z.string().optional().describe('Company address'),
  }),

  cliMappings: {
    args: [{ field: 'account_id', name: 'account-id', required: true }],
    options: [
      { field: 'name', flags: '--name <name>', description: 'Company name' },
      { field: 'domain', flags: '--domain <domain>', description: 'Company domain' },
      { field: 'phone_number', flags: '--phone <number>', description: 'Phone number' },
      { field: 'raw_address', flags: '--address <address>', description: 'Company address' },
    ],
  },

  endpoint: { method: 'PATCH', path: '/accounts/{account_id}' },

  fieldMappings: {
    account_id: 'path',
    name: 'body',
    domain: 'body',
    phone_number: 'body',
    raw_address: 'body',
  },

  handler: (input, client) => executeCommand(accountsUpdateCommand, input, client),
};
