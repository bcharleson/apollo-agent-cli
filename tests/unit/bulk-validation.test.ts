import { describe, it, expect, vi } from 'vitest';
import { accountsBulkCreateCommand } from '../../src/commands/accounts/bulk-create.js';
import { accountsBulkUpdateCommand } from '../../src/commands/accounts/bulk-update.js';
import { contactsBulkUpdateCommand } from '../../src/commands/contacts/bulk-update.js';
import { contactsUpdateLabelsCommand } from '../../src/commands/contacts/update-labels.js';
import { accountsUpdateLabelsCommand } from '../../src/commands/accounts/update-labels.js';
import { peopleBulkEnrichCommand } from '../../src/commands/people/bulk-enrich.js';

function makeStubClient() {
  const calls: any[] = [];
  return {
    client: {
      request: vi.fn(async (opts) => {
        calls.push(opts);
        return { ok: true };
      }),
      get: vi.fn(),
      post: vi.fn(async (path: string, body?: unknown) => {
        calls.push({ method: 'POST', path, body });
        return { ok: true };
      }),
      patch: vi.fn(),
      delete: vi.fn(),
    } as any,
    calls,
  };
}

describe('bulk JSON input validation', () => {
  describe('accounts bulk-create', () => {
    it('rejects invalid JSON', async () => {
      const { client } = makeStubClient();
      await expect(
        accountsBulkCreateCommand.handler({ accounts_json: 'not-json' }, client),
      ).rejects.toThrow(/valid JSON array/i);
    });

    it('rejects non-array JSON', async () => {
      const { client } = makeStubClient();
      await expect(
        accountsBulkCreateCommand.handler({ accounts_json: '{"id":"1"}' }, client),
      ).rejects.toThrow(/JSON array/i);
    });

    it('rejects > 100 accounts', async () => {
      const { client } = makeStubClient();
      const big = Array.from({ length: 101 }, (_, i) => ({ name: `acc${i}` }));
      await expect(
        accountsBulkCreateCommand.handler(
          { accounts_json: JSON.stringify(big) },
          client,
        ),
      ).rejects.toThrow(/Maximum 100/);
    });

    it('accepts 100 accounts (boundary)', async () => {
      const { client, calls } = makeStubClient();
      const arr = Array.from({ length: 100 }, (_, i) => ({ name: `acc${i}` }));
      await accountsBulkCreateCommand.handler(
        { accounts_json: JSON.stringify(arr) },
        client,
      );
      expect(calls[0].body.accounts).toHaveLength(100);
    });

    it('accepts 1 account', async () => {
      const { client, calls } = makeStubClient();
      await accountsBulkCreateCommand.handler(
        { accounts_json: '[{"name":"Acme","domain":"acme.com"}]' },
        client,
      );
      expect(calls[0].body.accounts).toEqual([{ name: 'Acme', domain: 'acme.com' }]);
    });
  });

  describe('accounts bulk-update', () => {
    it('rejects empty array', async () => {
      const { client } = makeStubClient();
      await expect(
        accountsBulkUpdateCommand.handler({ accounts_json: '[]' }, client),
      ).rejects.toThrow(/must not be empty/i);
    });

    it('rejects items missing "id" field', async () => {
      const { client } = makeStubClient();
      await expect(
        accountsBulkUpdateCommand.handler(
          { accounts_json: '[{"name":"Acme"}]' },
          client,
        ),
      ).rejects.toThrow(/must have an "id" field/);
    });

    it('rejects null entry in array', async () => {
      const { client } = makeStubClient();
      await expect(
        accountsBulkUpdateCommand.handler(
          { accounts_json: '[null]' },
          client,
        ),
      ).rejects.toThrow(/must have an "id" field/);
    });

    it('accepts well-formed updates', async () => {
      const { client, calls } = makeStubClient();
      await accountsBulkUpdateCommand.handler(
        { accounts_json: '[{"id":"a1","name":"Acme"}]' },
        client,
      );
      expect(calls[0].body.accounts).toEqual([{ id: 'a1', name: 'Acme' }]);
    });
  });

  describe('contacts bulk-update', () => {
    it('rejects items missing "id"', async () => {
      const { client } = makeStubClient();
      await expect(
        contactsBulkUpdateCommand.handler(
          { contacts_json: '[{"name":"X"}]' },
          client,
        ),
      ).rejects.toThrow(/must have an "id" field/);
    });

    it('rejects > 100 contacts', async () => {
      const { client } = makeStubClient();
      const big = Array.from({ length: 101 }, (_, i) => ({ id: `c${i}` }));
      await expect(
        contactsBulkUpdateCommand.handler(
          { contacts_json: JSON.stringify(big) },
          client,
        ),
      ).rejects.toThrow(/Maximum 100/);
    });

    it('rejects invalid JSON', async () => {
      const { client } = makeStubClient();
      await expect(
        contactsBulkUpdateCommand.handler({ contacts_json: '{[' }, client),
      ).rejects.toThrow(/valid JSON array/i);
    });
  });

  describe('update-labels (contacts and accounts)', () => {
    it('rejects empty --contact-ids', async () => {
      const { client } = makeStubClient();
      await expect(
        contactsUpdateLabelsCommand.handler(
          { contact_ids: '', label_names: 'hot' },
          client,
        ),
      ).rejects.toThrow(/at least one ID/i);
    });

    it('rejects empty --labels', async () => {
      const { client } = makeStubClient();
      await expect(
        contactsUpdateLabelsCommand.handler(
          { contact_ids: 'c1', label_names: '' },
          client,
        ),
      ).rejects.toThrow(/at least one label/i);
    });

    it('rejects all-whitespace --contact-ids', async () => {
      const { client } = makeStubClient();
      await expect(
        contactsUpdateLabelsCommand.handler(
          { contact_ids: ' , , ', label_names: 'hot' },
          client,
        ),
      ).rejects.toThrow(/at least one ID/i);
    });

    it('passes remove_labels through when --remove is set', async () => {
      const { client, calls } = makeStubClient();
      await contactsUpdateLabelsCommand.handler(
        { contact_ids: 'c1,c2', label_names: 'stale', remove_labels: true },
        client,
      );
      expect(calls[0].body.remove_labels).toBe(true);
    });

    it('omits remove_labels when not set', async () => {
      const { client, calls } = makeStubClient();
      await contactsUpdateLabelsCommand.handler(
        { contact_ids: 'c1', label_names: 'hot' },
        client,
      );
      expect(calls[0].body).not.toHaveProperty('remove_labels');
    });

    it('accounts update-labels rejects empty inputs (parity)', async () => {
      const { client } = makeStubClient();
      await expect(
        accountsUpdateLabelsCommand.handler(
          { account_ids: '', label_names: 'tier1' },
          client,
        ),
      ).rejects.toThrow(/at least one ID/i);
    });
  });

  describe('people enrich (client-side guards)', () => {
    it('rejects call with no identifier provided', async () => {
      const { client } = makeStubClient();
      const { peopleEnrichCommand } = await import('../../src/commands/people/enrich.js');
      await expect(peopleEnrichCommand.handler({}, client)).rejects.toThrow(
        /at least one identifier/i,
      );
    });

    it('rejects --reveal-phone without --webhook-url', async () => {
      const { client } = makeStubClient();
      const { peopleEnrichCommand } = await import('../../src/commands/people/enrich.js');
      await expect(
        peopleEnrichCommand.handler(
          { email: 'a@x.com', reveal_phone_number: true },
          client,
        ),
      ).rejects.toThrow(/--reveal-phone requires --webhook-url/);
    });

    it('accepts --email alone', async () => {
      const { client, calls } = makeStubClient();
      const { peopleEnrichCommand } = await import('../../src/commands/people/enrich.js');
      await peopleEnrichCommand.handler({ email: 'a@x.com' }, client);
      expect(calls[0].body).toMatchObject({ email: 'a@x.com' });
    });

    it('accepts --linkedin-url alone', async () => {
      const { client, calls } = makeStubClient();
      const { peopleEnrichCommand } = await import('../../src/commands/people/enrich.js');
      await peopleEnrichCommand.handler(
        { linkedin_url: 'https://linkedin.com/in/x' },
        client,
      );
      expect(calls[0].body).toMatchObject({ linkedin_url: 'https://linkedin.com/in/x' });
    });

    it('accepts --first-name + --last-name + --domain', async () => {
      const { client, calls } = makeStubClient();
      const { peopleEnrichCommand } = await import('../../src/commands/people/enrich.js');
      await peopleEnrichCommand.handler(
        { first_name: 'A', last_name: 'B', domain: 'x.com' },
        client,
      );
      expect(calls[0].body).toMatchObject({
        first_name: 'A',
        last_name: 'B',
        domain: 'x.com',
      });
    });

    it('rejects --first-name + --last-name WITHOUT domain or org', async () => {
      const { client } = makeStubClient();
      const { peopleEnrichCommand } = await import('../../src/commands/people/enrich.js');
      await expect(
        peopleEnrichCommand.handler({ first_name: 'A', last_name: 'B' }, client),
      ).rejects.toThrow(/at least one identifier/i);
    });
  });

  describe('people bulk-enrich', () => {
    it('throws when neither emails nor linkedin_urls is provided', async () => {
      const { client } = makeStubClient();
      await expect(peopleBulkEnrichCommand.handler({}, client)).rejects.toThrow(
        /Provide --emails or --linkedin-urls/,
      );
    });

    it('caps emails at 10 (silently truncates per Apollo bulk API limit)', async () => {
      const { client, calls } = makeStubClient();
      const emails = Array.from({ length: 20 }, (_, i) => `u${i}@x.com`).join(',');
      await peopleBulkEnrichCommand.handler({ emails }, client);
      expect(calls[0].body.details).toHaveLength(10);
    });

    it('throws when --reveal-phone is set without --webhook-url', async () => {
      const { client } = makeStubClient();
      await expect(
        peopleBulkEnrichCommand.handler(
          { emails: 'a@x.com', reveal_phone_number: true },
          client,
        ),
      ).rejects.toThrow(/--reveal-phone requires --webhook-url/);
    });

    it('accepts --reveal-phone when --webhook-url is provided', async () => {
      const { client, calls } = makeStubClient();
      await peopleBulkEnrichCommand.handler(
        {
          emails: 'a@x.com',
          reveal_phone_number: true,
          webhook_url: 'https://example.com/hook',
        },
        client,
      );
      expect(calls[0].body.reveal_phone_number).toBe(true);
      expect(calls[0].body.webhook_url).toBe('https://example.com/hook');
    });
  });
});
