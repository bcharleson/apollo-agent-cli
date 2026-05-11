import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const analyticsReportCommand: CommandDefinition = {
  name: 'analytics_report',
  group: 'analytics',
  subcommand: 'report',
  description:
    'Run a saved Apollo analytics report by ID. Returns the synchronously computed report payload. Requires master API key.',
  examples: [
    'apollo analytics report --report-id "rpt_abc123"',
    'apollo analytics report --report-id "rpt_abc123" --pretty',
  ],

  inputSchema: z.object({
    report_id: z.string().describe('Apollo report ID'),
  }),

  cliMappings: {
    options: [
      { field: 'report_id', flags: '--report-id <id>', description: 'Apollo report ID (required)' },
    ],
  },

  endpoint: { method: 'POST', path: '/reports/sync_report' },

  fieldMappings: {
    report_id: 'body',
  },

  handler: (input, client) => executeCommand(analyticsReportCommand, input, client),
};
