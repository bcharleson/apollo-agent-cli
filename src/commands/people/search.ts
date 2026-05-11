import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const peopleSearchCommand: CommandDefinition = {
  name: 'people_search',
  group: 'people',
  subcommand: 'search',
  description:
    "Search Apollo's 275M+ person database. No credits consumed. Returns profile data only — use \"people enrich\" to get emails/phones.",
  examples: [
    'apollo people search --keywords "VP Sales"',
    'apollo people search --domain apollo.io --title "VP Sales" --limit 25',
    'apollo people search --organization-name "Salesforce" --seniority "director,vp"',
  ],

  inputSchema: z.object({
    q_organization_domains_list: z
      .string()
      .optional()
      .describe('Comma-separated list of company domains to search within'),
    q_keywords: z.string().optional().describe('Free-text keyword search across all fields'),
    page: z.coerce.number().min(1).default(1).describe('Page number (1-indexed)'),
    per_page: z.coerce.number().min(1).max(100).default(25).describe('Results per page (1-100)'),
    person_titles: z
      .string()
      .optional()
      .describe('Comma-separated job titles (e.g. "VP Sales,Head of Growth")'),
    person_seniorities: z
      .string()
      .optional()
      .describe(
        'Comma-separated seniority levels: owner,founder,c_suite,partner,vp,head,director,manager,senior,entry,intern',
      ),
    organization_industry_tag_ids: z
      .string()
      .optional()
      .describe('Comma-separated Apollo industry tag IDs'),
    organization_num_employees_ranges: z
      .string()
      .optional()
      .describe('Employee ranges (e.g. "1,10,11,50,51,200")'),
    q_organization_name: z.string().optional().describe('Organization name to search within'),
    person_locations: z
      .string()
      .optional()
      .describe('Comma-separated locations (city, state, country)'),
    contact_email_status: z
      .string()
      .optional()
      .describe(
        'Email status filter: verified,guessed,unavailable,bounced,pending_manual_fulfillment',
      ),
  }),

  cliMappings: {
    options: [
      {
        field: 'q_organization_domains_list',
        flags: '--domain <domains>',
        description: 'Company domains (comma-separated)',
      },
      { field: 'q_keywords', flags: '--keywords <text>', description: 'Free-text keyword search' },
      { field: 'page', flags: '--page <number>', description: 'Page number (default: 1)' },
      {
        field: 'per_page',
        flags: '-l, --limit <number>',
        description: 'Results per page (1-100, default: 25)',
      },
      {
        field: 'person_titles',
        flags: '--title <titles>',
        description: 'Job titles (comma-separated)',
      },
      {
        field: 'person_seniorities',
        flags: '--seniority <levels>',
        description: 'Seniority levels (comma-separated)',
      },
      {
        field: 'q_organization_name',
        flags: '--organization-name <name>',
        description: 'Company name filter',
      },
      {
        field: 'person_locations',
        flags: '--location <locations>',
        description: 'Locations (comma-separated)',
      },
      {
        field: 'organization_num_employees_ranges',
        flags: '--employee-range <ranges>',
        description: 'Employee count ranges (e.g. "1,10,11,50")',
      },
      {
        field: 'contact_email_status',
        flags: '--email-status <status>',
        description: 'Email status: verified,guessed,unavailable,bounced',
      },
    ],
  },

  endpoint: { method: 'POST', path: '/mixed_people/api_search' },

  paginated: true,

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const splitCsv = (v: string) => v.split(',').map((s: string) => s.trim()).filter(Boolean);

    const body: Record<string, any> = {
      page: input.page,
      per_page: input.per_page,
    };

    if (input.q_organization_domains_list)
      body.q_organization_domains_list = splitCsv(input.q_organization_domains_list);
    if (input.q_keywords) body.q_keywords = input.q_keywords;
    if (input.person_titles) body.person_titles = splitCsv(input.person_titles);
    if (input.person_seniorities) body.person_seniorities = splitCsv(input.person_seniorities);
    if (input.organization_industry_tag_ids)
      body.organization_industry_tag_ids = splitCsv(input.organization_industry_tag_ids);
    if (input.organization_num_employees_ranges)
      body.organization_num_employees_ranges = splitCsv(input.organization_num_employees_ranges);
    if (input.q_organization_name) body.q_organization_name = input.q_organization_name;
    if (input.person_locations) body.person_locations = splitCsv(input.person_locations);
    if (input.contact_email_status)
      body.contact_email_status = splitCsv(input.contact_email_status);

    return client.post('/mixed_people/api_search', body);
  },
};
