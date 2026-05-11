import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const customFieldsListCommand: CommandDefinition = {
  name: 'custom_fields_list',
  group: 'custom-fields',
  subcommand: 'list',
  description:
    'List all typed custom fields configured in your Apollo workspace. Use the returned IDs/keys when populating custom fields on contacts, accounts, or deals. Requires master API key.',
  examples: ['apollo custom-fields list', 'apollo custom-fields list --fields id,name,modality'],

  inputSchema: z.object({}),

  cliMappings: {},

  endpoint: { method: 'GET', path: '/typed_custom_fields' },

  fieldMappings: {},

  handler: (input, client) => executeCommand(customFieldsListCommand, input, client),
};
