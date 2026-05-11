import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const listsListCommand: CommandDefinition = {
  name: 'lists_list',
  group: 'lists',
  subcommand: 'list',
  description:
    'List static lead lists (saved contact collections) in your Apollo workspace. Note: Apollo does not expose CRUD operations for lists via the public REST API.',
  examples: ['apollo lists list', 'apollo lists list --pretty'],

  inputSchema: z.object({}),

  cliMappings: {},

  endpoint: { method: 'GET', path: '/lists' },

  fieldMappings: {},

  handler: (input, client) => executeCommand(listsListCommand, input, client),
};
