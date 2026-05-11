import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { UserInputError } from '../../core/errors.js';

export const peopleBulkEnrichCommand: CommandDefinition = {
  name: 'people_bulk_enrich',
  group: 'people',
  subcommand: 'bulk-enrich',
  description:
    'Enrich up to 10 people in a single request. Each person is matched by email, LinkedIn URL, or name+domain. Consumes credits per match.',
  examples: [
    'apollo people bulk-enrich --emails "john@a.com,jane@b.com"',
    'apollo people bulk-enrich --linkedin-urls "https://linkedin.com/in/john,https://linkedin.com/in/jane"',
  ],

  inputSchema: z.object({
    emails: z.string().optional().describe('Comma-separated email addresses (up to 10)'),
    linkedin_urls: z.string().optional().describe('Comma-separated LinkedIn URLs (up to 10)'),
    reveal_personal_emails: z.boolean().optional().describe('Attempt to find personal emails'),
    reveal_phone_number: z.boolean().optional().describe('Attempt to find phone numbers (async, requires webhook_url)'),
    webhook_url: z.string().optional().describe('Webhook URL for async phone enrichment results'),
  }),

  cliMappings: {
    options: [
      { field: 'emails', flags: '--emails <emails>', description: 'Comma-separated emails (up to 10)' },
      { field: 'linkedin_urls', flags: '--linkedin-urls <urls>', description: 'Comma-separated LinkedIn URLs (up to 10)' },
      { field: 'reveal_personal_emails', flags: '--reveal-emails', description: 'Attempt to find personal emails' },
      { field: 'reveal_phone_number', flags: '--reveal-phone', description: 'Attempt to find phones (async, requires --webhook-url)' },
      { field: 'webhook_url', flags: '--webhook-url <url>', description: 'Webhook URL for async phone results' },
    ],
  },

  endpoint: { method: 'POST', path: '/people/bulk_match' },

  fieldMappings: {
    emails: 'body',
    linkedin_urls: 'body',
    reveal_personal_emails: 'body',
    reveal_phone_number: 'body',
    webhook_url: 'body',
  },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    if (input.reveal_phone_number && !input.webhook_url) {
      throw new UserInputError('--reveal-phone requires --webhook-url (results are async)');
    }

    // Build details array from comma-separated inputs
    const details: Record<string, string>[] = [];

    if (input.emails) {
      const emails = input.emails.split(',').map((e: string) => e.trim()).slice(0, 10);
      for (const email of emails) {
        details.push({ email });
      }
    } else if (input.linkedin_urls) {
      const urls = input.linkedin_urls.split(',').map((u: string) => u.trim()).slice(0, 10);
      for (const linkedin_url of urls) {
        details.push({ linkedin_url });
      }
    }

    if (details.length === 0) {
      throw new UserInputError('Provide --emails or --linkedin-urls');
    }

    return client.post('/people/bulk_match', {
      details,
      reveal_personal_emails: input.reveal_personal_emails,
      reveal_phone_number: input.reveal_phone_number,
      webhook_url: input.webhook_url,
    });
  },
};
