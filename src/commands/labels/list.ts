import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const labelsListCommand: CommandDefinition = {
  name: 'labels_list',
  group: 'labels',
  subcommand: 'list',
  description:
    'List all labels (tags) defined in your Apollo workspace. Use these names when calling "contacts update-labels" or "accounts update-labels".',
  examples: ['apollo labels list', 'apollo labels list --fields id,name'],

  inputSchema: z.object({}),

  cliMappings: {},

  endpoint: { method: 'GET', path: '/labels' },

  fieldMappings: {},

  handler: (input, client) => executeCommand(labelsListCommand, input, client),
};
