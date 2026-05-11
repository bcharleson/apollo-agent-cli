import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const organizationsSearchCommand: CommandDefinition = {
  name: 'organizations_search',
  group: 'organizations',
  subcommand: 'search',
  description:
    "Search Apollo's company database (mixed_companies). NO credits consumed. Filter by industry, headcount, location, technology, and keywords.",
  examples: [
    'apollo organizations search --keywords "saas" --limit 25',
    'apollo organizations search --domain stripe.com',
    'apollo organizations search --keywords "fintech" --employee-range "201,500" --location "San Francisco"',
  ],

  inputSchema: z.object({
    q_organization_keyword_tags: z
      .string()
      .optional()
      .describe('Comma-separated keyword tags to match'),
    q_organization_name: z.string().optional().describe('Company name search'),
    q_keywords: z.string().optional().describe('Free-text keyword search'),
    q_organization_domains_list: z
      .string()
      .optional()
      .describe('Comma-separated company domains'),
    organization_locations: z
      .string()
      .optional()
      .describe('Comma-separated locations (city/state/country)'),
    organization_num_employees_ranges: z
      .string()
      .optional()
      .describe('Employee ranges (e.g. "1,10,11,50,51,200")'),
    currently_using_any_of_technology_uids: z
      .string()
      .optional()
      .describe('Comma-separated Apollo technology UIDs to filter by'),
    page: z.coerce.number().min(1).default(1).describe('Page number'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page'),
  }),

  cliMappings: {
    options: [
      { field: 'q_keywords', flags: '--keywords <text>', description: 'Free-text search' },
      { field: 'q_organization_name', flags: '--name <name>', description: 'Company name' },
      { field: 'q_organization_domains_list', flags: '--domain <domains>', description: 'Domains (comma-separated)' },
      { field: 'q_organization_keyword_tags', flags: '--tags <tags>', description: 'Keyword tags (comma-separated)' },
      { field: 'organization_locations', flags: '--location <locations>', description: 'Locations (comma-separated)' },
      { field: 'organization_num_employees_ranges', flags: '--employee-range <ranges>', description: 'Headcount ranges (e.g. "1,10,11,50")' },
      { field: 'currently_using_any_of_technology_uids', flags: '--tech <uids>', description: 'Technology UIDs (comma-separated)' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      { field: 'per_page', flags: '-l, --limit <number>', description: 'Results per page (1-100, default: 25)' },
    ],
  },

  endpoint: { method: 'POST', path: '/mixed_companies/search' },

  paginated: true,

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const splitCsv = (v: string) => v.split(',').map((s: string) => s.trim()).filter(Boolean);

    const body: Record<string, any> = { page: input.page, per_page: input.per_page };
    if (input.q_keywords) body.q_keywords = input.q_keywords;
    if (input.q_organization_name) body.q_organization_name = input.q_organization_name;
    if (input.q_organization_domains_list)
      body.q_organization_domains_list = splitCsv(input.q_organization_domains_list);
    if (input.q_organization_keyword_tags)
      body.q_organization_keyword_tags = splitCsv(input.q_organization_keyword_tags);
    if (input.organization_locations)
      body.organization_locations = splitCsv(input.organization_locations);
    if (input.organization_num_employees_ranges)
      body.organization_num_employees_ranges = splitCsv(input.organization_num_employees_ranges);
    if (input.currently_using_any_of_technology_uids)
      body.currently_using_any_of_technology_uids = splitCsv(
        input.currently_using_any_of_technology_uids,
      );

    return client.post('/mixed_companies/search', body);
  },
};
