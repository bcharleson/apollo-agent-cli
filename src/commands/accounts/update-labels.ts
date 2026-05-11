import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { UserInputError } from '../../core/errors.js';

export const accountsUpdateLabelsCommand: CommandDefinition = {
  name: 'accounts_update_labels',
  group: 'accounts',
  subcommand: 'update-labels',
  description:
    'Apply or remove labels on multiple accounts at once. Requires master API key.',
  examples: [
    'apollo accounts update-labels --account-ids "a1,a2" --labels "tier1,strategic"',
    'apollo accounts update-labels --account-ids "a1" --labels "stale" --remove',
  ],

  inputSchema: z.object({
    account_ids: z.string().describe('Comma-separated account IDs'),
    label_names: z.string().describe('Comma-separated label names'),
    remove_labels: z
      .boolean()
      .optional()
      .describe('If true, remove the listed labels instead of adding them'),
  }),

  cliMappings: {
    options: [
      { field: 'account_ids', flags: '--account-ids <ids>', description: 'Account IDs (comma-separated)' },
      { field: 'label_names', flags: '--labels <labels>', description: 'Label names (comma-separated)' },
      { field: 'remove_labels', flags: '--remove', description: 'Remove labels instead of adding' },
    ],
  },

  endpoint: { method: 'POST', path: '/accounts/update_labels' },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const splitCsv = (v: string) => v.split(',').map((s: string) => s.trim()).filter(Boolean);

    const body: Record<string, any> = {
      account_ids: splitCsv(input.account_ids),
      label_names: splitCsv(input.label_names),
    };
    if (input.remove_labels) body.remove_labels = true;

    if (body.account_ids.length === 0) throw new UserInputError('--account-ids must include at least one ID');
    if (body.label_names.length === 0) throw new UserInputError('--labels must include at least one label');

    return client.post('/accounts/update_labels', body);
  },
};
