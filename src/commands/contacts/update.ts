import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { UserInputError } from '../../core/errors.js';

export const contactsUpdateCommand: CommandDefinition = {
  name: 'contacts_update',
  group: 'contacts',
  subcommand: 'update',
  description: 'Update a contact in your Apollo CRM by contact ID.',
  examples: [
    'apollo contacts update <contact-id> --title "CTO"',
    'apollo contacts update <contact-id> --email newemail@example.com --phone "+1-555-0100"',
    'apollo contacts update <contact-id> --labels "hot-lead,qualified"',
  ],

  inputSchema: z.object({
    contact_id: z.string().describe('Apollo contact ID'),
    first_name: z.string().optional().describe('First name'),
    last_name: z.string().optional().describe('Last name'),
    email: z.string().optional().describe('Email address'),
    title: z.string().optional().describe('Job title'),
    organization_name: z.string().optional().describe('Company name'),
    phone_number: z.string().optional().describe('Phone number'),
    linkedin_url: z.string().optional().describe('LinkedIn profile URL'),
    website_url: z.string().optional().describe('Website URL'),
    label_names: z.string().optional().describe('Comma-separated label names to assign'),
  }),

  cliMappings: {
    args: [{ field: 'contact_id', name: 'contact-id', required: true }],
    options: [
      { field: 'first_name', flags: '--first-name <name>', description: 'First name' },
      { field: 'last_name', flags: '--last-name <name>', description: 'Last name' },
      { field: 'email', flags: '--email <email>', description: 'Email address' },
      { field: 'title', flags: '--title <title>', description: 'Job title' },
      { field: 'organization_name', flags: '--org <name>', description: 'Company name' },
      { field: 'phone_number', flags: '--phone <number>', description: 'Phone number' },
      { field: 'linkedin_url', flags: '--linkedin-url <url>', description: 'LinkedIn URL' },
      { field: 'website_url', flags: '--website <url>', description: 'Website URL' },
      { field: 'label_names', flags: '--labels <labels>', description: 'Label names (comma-separated)' },
    ],
  },

  endpoint: { method: 'PATCH', path: '/contacts/{contact_id}' },

  handler: async (inp, client) => {
    const input = inp as Record<string, any>;
    const { contact_id, label_names, ...rest } = input;
    if (!contact_id) throw new UserInputError('contact-id is required');

    const body: Record<string, any> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined && v !== null && v !== '') body[k] = v;
    }
    if (label_names) {
      body.label_names = String(label_names)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return client.patch(`/contacts/${encodeURIComponent(contact_id)}`, body);
  },
};
