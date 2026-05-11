import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const tasksCreateCommand: CommandDefinition = {
  name: 'tasks_create',
  group: 'tasks',
  subcommand: 'create',
  description: 'Create a new task in Apollo (call, email, LinkedIn, research). Requires master API key.',
  examples: [
    'apollo tasks create --type call --contact-id "contact_abc" --due-date "2026-04-01"',
    'apollo tasks create --type email --contact-id "contact_abc" --note "Follow up on demo"',
  ],

  inputSchema: z.object({
    type: z.enum(['call', 'email', 'linkedin', 'research', 'other']).describe('Task type'),
    contact_ids: z.string().optional().describe('Comma-separated contact IDs to associate'),
    account_id: z.string().optional().describe('Account ID to associate'),
    due_at: z.string().optional().describe('Due date/time (ISO 8601 or YYYY-MM-DD)'),
    note: z.string().optional().describe('Task note or description'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
    owner_id: z.string().optional().describe('Assignee user ID'),
  }),

  cliMappings: {
    options: [
      { field: 'type', flags: '--type <type>', description: 'Task type: call, email, linkedin, research, other' },
      { field: 'contact_ids', flags: '--contact-id <ids>', description: 'Contact ID(s) (comma-separated)' },
      { field: 'account_id', flags: '--account-id <id>', description: 'Account ID' },
      { field: 'due_at', flags: '--due-date <date>', description: 'Due date (YYYY-MM-DD or ISO 8601)' },
      { field: 'note', flags: '--note <text>', description: 'Task note' },
      { field: 'priority', flags: '--priority <level>', description: 'Priority: low, medium, high' },
      { field: 'owner_id', flags: '--owner-id <id>', description: 'Assignee user ID' },
    ],
  },

  endpoint: { method: 'POST', path: '/tasks' },

  fieldMappings: {
    type: 'body',
    contact_ids: 'body',
    account_id: 'body',
    due_at: 'body',
    note: 'body',
    priority: 'body',
    owner_id: 'body',
  },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const body: Record<string, any> = { type: input.type };
    if (input.contact_ids) body.contact_ids = input.contact_ids.split(',').map((s: string) => s.trim());
    if (input.account_id) body.account_id = input.account_id;
    if (input.due_at) body.due_at = input.due_at;
    if (input.note) body.note = input.note;
    if (input.priority) body.priority = input.priority;
    if (input.owner_id) body.owner_id = input.owner_id;
    return client.post('/tasks', body);
  },
};
