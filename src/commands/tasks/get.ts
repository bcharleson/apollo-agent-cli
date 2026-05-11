import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const tasksGetCommand: CommandDefinition = {
  name: 'tasks_get',
  group: 'tasks',
  subcommand: 'get',
  description:
    'Get a single task by ID. Returns full task record including assignee, due date, contact, and notes. Requires master API key.',
  examples: ['apollo tasks get <task-id>', 'apollo tasks get <task-id> --pretty'],

  inputSchema: z.object({
    task_id: z.string().describe('Apollo task ID'),
  }),

  cliMappings: {
    args: [{ field: 'task_id', name: 'task-id', required: true }],
  },

  endpoint: { method: 'GET', path: '/tasks/{task_id}' },

  fieldMappings: {
    task_id: 'path',
  },

  handler: (input, client) => executeCommand(tasksGetCommand, input, client),
};
