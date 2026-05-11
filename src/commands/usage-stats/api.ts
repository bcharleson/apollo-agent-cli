import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const usageStatsApiCommand: CommandDefinition = {
  name: 'usage_stats_api',
  group: 'usage-stats',
  subcommand: 'api',
  description:
    'Get API usage telemetry for your Apollo workspace — total requests, requests by endpoint, and rate-limit status. Requires master API key.',
  examples: ['apollo usage-stats api', 'apollo usage-stats api --pretty'],

  inputSchema: z.object({}),

  cliMappings: {},

  endpoint: { method: 'POST', path: '/usage_stats/api_usage_stats' },

  fieldMappings: {},

  handler: (input, client) => executeCommand(usageStatsApiCommand, input, client),
};
