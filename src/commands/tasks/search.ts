import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const tasksSearchCommand: CommandDefinition = {
  name: 'tasks_search',
  group: 'tasks',
  subcommand: 'search',
  description: 'Search tasks in Apollo. Returns call tasks, email tasks, and to-dos. Requires master API key.',
  examples: [
    'apollo tasks search',
    'apollo tasks search --limit 50 --type call',
    'apollo tasks search --owner-id "user_abc"',
  ],

  inputSchema: z.object({
    task_types: z.string().optional().describe('Comma-separated task types: call,email,linkedin,research'),
    assignee_ids: z.string().optional().describe('Comma-separated user IDs to filter by assignee'),
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page'),
    sort_by_field: z.string().optional().describe('Field to sort by'),
    sort_ascending: z.boolean().optional().describe('Sort ascending'),
  }),

  cliMappings: {
    options: [
      { field: 'task_types', flags: '--type <types>', description: 'Task types: call,email,linkedin,research (comma-separated)' },
      { field: 'assignee_ids', flags: '--owner-id <ids>', description: 'Assignee user IDs (comma-separated)' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (default: 25)' },
      { field: 'sort_by_field', flags: '--sort-by <field>', description: 'Sort field' },
      { field: 'sort_ascending', flags: '--sort-asc', description: 'Sort ascending' },
    ],
  },

  endpoint: { method: 'POST', path: '/tasks/search' },

  fieldMappings: {
    task_types: 'body',
    assignee_ids: 'body',
    page: 'body',
    per_page: 'body',
    sort_by_field: 'body',
    sort_ascending: 'body',
  },

  paginated: true,

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const body: Record<string, any> = { page: input.page, per_page: input.per_page };
    if (input.task_types) body.task_types = input.task_types.split(',').map((s: string) => s.trim());
    if (input.assignee_ids) body.assignee_ids = input.assignee_ids.split(',').map((s: string) => s.trim());
    if (input.sort_by_field) body.sort_by_field = input.sort_by_field;
    if (input.sort_ascending !== undefined) body.sort_ascending = input.sort_ascending;
    return client.post('/tasks/search', body);
  },
};
