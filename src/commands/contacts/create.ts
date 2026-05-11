import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const contactsCreateCommand: CommandDefinition = {
  name: 'contacts_create',
  group: 'contacts',
  subcommand: 'create',
  description: 'Create a new contact in your Apollo CRM. Deduplication is enabled by default to prevent duplicate records.',
  examples: [
    'apollo contacts create --first-name John --last-name Smith --email john@example.com',
    'apollo contacts create --first-name Jane --last-name Doe --email jane@co.com --title "VP Sales" --org "Acme Corp" --no-dedupe',
  ],

  inputSchema: z.object({
    first_name: z.string().describe('First name'),
    last_name: z.string().describe('Last name'),
    email: z.string().optional().describe('Email address'),
    title: z.string().optional().describe('Job title'),
    organization_name: z.string().optional().describe('Company name'),
    phone_number: z.string().optional().describe('Phone number'),
    linkedin_url: z.string().optional().describe('LinkedIn profile URL'),
    website_url: z.string().optional().describe('Personal or company website'),
    run_dedupe: z.boolean().default(true).describe('Check for duplicates before creating (default: true)'),
  }),

  cliMappings: {
    options: [
      { field: 'first_name', flags: '--first-name <name>', description: 'First name (required)' },
      { field: 'last_name', flags: '--last-name <name>', description: 'Last name (required)' },
      { field: 'email', flags: '--email <email>', description: 'Email address' },
      { field: 'title', flags: '--title <title>', description: 'Job title' },
      { field: 'organization_name', flags: '--org <name>', description: 'Company name' },
      { field: 'phone_number', flags: '--phone <number>', description: 'Phone number' },
      { field: 'linkedin_url', flags: '--linkedin-url <url>', description: 'LinkedIn URL' },
      { field: 'website_url', flags: '--website <url>', description: 'Website URL' },
      { field: 'run_dedupe', flags: '--no-dedupe', description: 'Skip deduplication check (not recommended)' },
    ],
  },

  endpoint: { method: 'POST', path: '/contacts' },

  fieldMappings: {
    first_name: 'body',
    last_name: 'body',
    email: 'body',
    title: 'body',
    organization_name: 'body',
    phone_number: 'body',
    linkedin_url: 'body',
    website_url: 'body',
    run_dedupe: 'body',
  },

  handler: (input, client) => client.post('/contacts', input),
};
