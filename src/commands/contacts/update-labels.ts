import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const contactsUpdateLabelsCommand: CommandDefinition = {
  name: 'contacts_update_labels',
  group: 'contacts',
  subcommand: 'update-labels',
  description:
    'Apply or remove labels on multiple contacts at once. Pass comma-separated contact IDs and label names. Requires master API key.',
  examples: [
    'apollo contacts update-labels --contact-ids "c1,c2,c3" --labels "hot-lead,qualified"',
    'apollo contacts update-labels --contact-ids "c1" --labels "stale" --remove',
  ],

  inputSchema: z.object({
    contact_ids: z.string().describe('Comma-separated contact IDs'),
    label_names: z.string().describe('Comma-separated label names'),
    remove_labels: z
      .boolean()
      .optional()
      .describe('If true, remove the listed labels instead of adding them'),
  }),

  cliMappings: {
    options: [
      {
        field: 'contact_ids',
        flags: '--contact-ids <ids>',
        description: 'Contact IDs (comma-separated)',
      },
      { field: 'label_names', flags: '--labels <labels>', description: 'Label names (comma-separated)' },
      { field: 'remove_labels', flags: '--remove', description: 'Remove labels instead of adding' },
    ],
  },

  endpoint: { method: 'POST', path: '/contacts/update_labels' },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const splitCsv = (v: string) => v.split(',').map((s: string) => s.trim()).filter(Boolean);

    const body: Record<string, any> = {
      contact_ids: splitCsv(input.contact_ids),
      label_names: splitCsv(input.label_names),
    };
    if (input.remove_labels) body.remove_labels = true;

    if (body.contact_ids.length === 0) throw new Error('--contact-ids must include at least one ID');
    if (body.label_names.length === 0) throw new Error('--labels must include at least one label');

    return client.post('/contacts/update_labels', body);
  },
};
