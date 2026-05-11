import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const emailAccountsGetCommand: CommandDefinition = {
  name: 'email_accounts_get',
  group: 'email-accounts',
  subcommand: 'get',
  description:
    'Get a single connected sending inbox by email account ID. Returns SMTP settings, daily send limits, and warmup status. Requires master API key.',
  examples: [
    'apollo email-accounts get <email-account-id>',
    'apollo email-accounts get <email-account-id> --pretty',
  ],

  inputSchema: z.object({
    email_account_id: z.string().describe('Apollo email account ID'),
  }),

  cliMappings: {
    args: [{ field: 'email_account_id', name: 'email-account-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/email_accounts/{email_account_id}' },

  fieldMappings: {
    email_account_id: 'path',
  },

  handler: (input, client) => executeCommand(emailAccountsGetCommand, input, client),
};
