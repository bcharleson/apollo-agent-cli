import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const peopleEnrichCommand: CommandDefinition = {
  name: 'people_enrich',
  group: 'people',
  subcommand: 'enrich',
  description:
    'Enrich a single person by email, LinkedIn URL, or name+company. Consumes credits. Returns full profile including email and phone (if available).',
  examples: [
    'apollo people enrich --email john@example.com',
    'apollo people enrich --linkedin-url https://linkedin.com/in/johndoe',
    'apollo people enrich --first-name John --last-name Smith --domain example.com',
    'apollo people enrich --email john@example.com --reveal-emails',
  ],

  inputSchema: z.object({
    first_name: z.string().optional().describe('First name'),
    last_name: z.string().optional().describe('Last name'),
    email: z.string().optional().describe('Email address'),
    hashed_email: z.string().optional().describe('MD5 or SHA-256 hashed email'),
    organization_name: z.string().optional().describe('Company name'),
    domain: z.string().optional().describe('Company domain'),
    linkedin_url: z.string().optional().describe('LinkedIn profile URL'),
    reveal_personal_emails: z.boolean().optional().describe('Attempt to find personal email addresses'),
    reveal_phone_number: z.boolean().optional().describe('Attempt to find phone numbers (requires webhook_url, async)'),
    webhook_url: z.string().optional().describe('Webhook URL to receive async phone enrichment results'),
  }),

  cliMappings: {
    options: [
      { field: 'first_name', flags: '--first-name <name>', description: 'First name' },
      { field: 'last_name', flags: '--last-name <name>', description: 'Last name' },
      { field: 'email', flags: '--email <email>', description: 'Email address' },
      { field: 'hashed_email', flags: '--hashed-email <hash>', description: 'MD5 or SHA-256 hashed email' },
      { field: 'organization_name', flags: '--org-name <name>', description: 'Company name' },
      { field: 'domain', flags: '--domain <domain>', description: 'Company domain' },
      { field: 'linkedin_url', flags: '--linkedin-url <url>', description: 'LinkedIn profile URL' },
      { field: 'reveal_personal_emails', flags: '--reveal-emails', description: 'Attempt to find personal emails (uses credits)' },
      { field: 'reveal_phone_number', flags: '--reveal-phone', description: 'Attempt to find phone (async, requires --webhook-url)' },
      { field: 'webhook_url', flags: '--webhook-url <url>', description: 'Webhook URL for async phone enrichment results' },
    ],
  },

  endpoint: { method: 'POST', path: '/people/match' },

  fieldMappings: {
    first_name: 'body',
    last_name: 'body',
    email: 'body',
    hashed_email: 'body',
    organization_name: 'body',
    domain: 'body',
    linkedin_url: 'body',
    reveal_personal_emails: 'body',
    reveal_phone_number: 'body',
    webhook_url: 'body',
  },

  handler: async (input, client) => {
    if (input.reveal_phone_number && !input.webhook_url) {
      throw new Error(
        '--reveal-phone requires --webhook-url (results are delivered asynchronously to your webhook endpoint)',
      );
    }
    return client.post('/people/match', input);
  },
};
