import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { UserInputError } from '../../core/errors.js';

export const tasksUpdateCommand: CommandDefinition = {
  name: 'tasks_update',
  group: 'tasks',
  subcommand: 'update',
  description:
    'Update a task by task ID. Change due date, status, owner, or notes. Requires master API key.',
  examples: [
    'apollo tasks update <task-id> --status completed',
    'apollo tasks update <task-id> --due-date "2026-04-30" --note "Rescheduled"',
  ],

  inputSchema: z.object({
    task_id: z.string().describe('Apollo task ID'),
    status: z
      .enum(['scheduled', 'completed', 'archived'])
      .optional()
      .describe('Task status: scheduled, completed, or archived'),
    due_at: z.string().optional().describe('Due date (ISO 8601 / YYYY-MM-DD)'),
    note: z.string().optional().describe('Free-form note'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Priority level'),
    owner_id: z.string().optional().describe('Apollo user ID of the owner'),
  }),

  cliMappings: {
    args: [{ field: 'task_id', name: 'task-id', required: true }],
    options: [
      { field: 'status', flags: '--status <status>', description: 'scheduled | completed | archived' },
      { field: 'due_at', flags: '--due-date <date>', description: 'Due date (YYYY-MM-DD)' },
      { field: 'note', flags: '--note <text>', description: 'Free-form note' },
      { field: 'priority', flags: '--priority <level>', description: 'low | medium | high' },
      { field: 'owner_id', flags: '--owner-id <id>', description: 'Owner user ID' },
    ],
  },

  endpoint: { method: 'PATCH', path: '/tasks/{task_id}' },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const { task_id, ...rest } = input;
    if (!task_id) throw new UserInputError('task-id is required');

    const body: Record<string, any> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined && v !== null && v !== '') body[k] = v;
    }
    if (Object.keys(body).length === 0) {
      throw new UserInputError('Provide at least one field to update');
    }

    return client.patch(`/tasks/${encodeURIComponent(task_id)}`, body);
  },
};
