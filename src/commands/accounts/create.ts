import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const accountsCreateCommand: CommandDefinition = {
  name: 'accounts_create',
  group: 'accounts',
  subcommand: 'create',
  description: 'Create a new account (company) in your Apollo CRM. Requires a master API key.',
  examples: [
    'apollo accounts create --name "Acme Corp" --domain acme.com',
    'apollo accounts create --name "Startup Inc" --domain startup.io --phone "+1-555-0100"',
  ],

  inputSchema: z.object({
    name: z.string().describe('Company name'),
    domain: z.string().optional().describe('Company domain (e.g. acme.com)'),
    phone_number: z.string().optional().describe('Company phone number'),
    raw_address: z.string().optional().describe('Company address'),
  }),

  cliMappings: {
    options: [
      { field: 'name', flags: '--name <name>', description: 'Company name (required)' },
      { field: 'domain', flags: '--domain <domain>', description: 'Company domain' },
      { field: 'phone_number', flags: '--phone <number>', description: 'Company phone' },
      { field: 'raw_address', flags: '--address <address>', description: 'Company address' },
    ],
  },

  endpoint: { method: 'POST', path: '/accounts' },

  fieldMappings: {
    name: 'body',
    domain: 'body',
    phone_number: 'body',
    raw_address: 'body',
  },

  handler: (input, client) => executeCommand(accountsCreateCommand, input, client),
};
