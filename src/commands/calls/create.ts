import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const callsCreateCommand: CommandDefinition = {
  name: 'calls_create',
  group: 'calls',
  subcommand: 'create',
  description: 'Log an external call record in Apollo (from Orum, Nooks, etc.). Cannot dial prospects. Requires master API key.',
  examples: [
    'apollo calls create --contact-id "contact_abc" --duration 300 --outcome "connected"',
    'apollo calls create --contact-id "contact_abc" --duration 120 --note "Discussed pricing" --outcome "connected"',
  ],

  inputSchema: z.object({
    contact_id: z.string().describe('Contact ID to associate the call with'),
    duration_in_seconds: z.coerce.number().optional().describe('Call duration in seconds'),
    outcome: z.string().optional().describe('Call outcome (e.g. connected, voicemail, no_answer)'),
    note: z.string().optional().describe('Call notes'),
    recorded_at: z.string().optional().describe('When the call occurred (ISO 8601)'),
  }),

  cliMappings: {
    options: [
      { field: 'contact_id', flags: '--contact-id <id>', description: 'Contact ID (required)' },
      { field: 'duration_in_seconds', flags: '--duration <seconds>', description: 'Call duration in seconds' },
      { field: 'outcome', flags: '--outcome <outcome>', description: 'Call outcome: connected, voicemail, no_answer' },
      { field: 'note', flags: '--note <text>', description: 'Call notes' },
      { field: 'recorded_at', flags: '--recorded-at <datetime>', description: 'Call datetime (ISO 8601)' },
    ],
  },

  endpoint: { method: 'POST', path: '/phone_calls' },

  fieldMappings: {
    contact_id: 'body',
    duration_in_seconds: 'body',
    outcome: 'body',
    note: 'body',
    recorded_at: 'body',
  },

  handler: (input, client) => executeCommand(callsCreateCommand, input, client),
};
