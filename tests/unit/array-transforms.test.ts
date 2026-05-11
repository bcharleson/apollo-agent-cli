import { describe, it, expect, vi } from 'vitest';
import { peopleSearchCommand } from '../../src/commands/people/search.js';
import { contactsUpdateCommand } from '../../src/commands/contacts/update.js';
import { sequencesAddContactsCommand } from '../../src/commands/sequences/add-contacts.js';
import { sequencesRemoveContactsCommand } from '../../src/commands/sequences/remove-contacts.js';
import { peopleBulkEnrichCommand } from '../../src/commands/people/bulk-enrich.js';

interface CapturedRequest {
  method: string;
  path: string;
  body: unknown;
  query?: unknown;
}

function makeStubClient(): { client: any; calls: CapturedRequest[] } {
  const calls: CapturedRequest[] = [];
  const recorder = (method: string) => async (path: string, body?: unknown, query?: unknown) => {
    calls.push({ method, path, body, query });
    return { ok: true };
  };
  const client = {
    request: vi.fn(async (opts: any) => {
      calls.push({ method: opts.method, path: opts.path, body: opts.body, query: opts.query });
      return { ok: true };
    }),
    get: recorder('GET'),
    post: recorder('POST'),
    patch: recorder('PATCH'),
    delete: recorder('DELETE'),
  };
  return { client, calls };
}

describe('comma-separated → array transforms', () => {
  it('people_search splits --domain into q_organization_domains_list array', async () => {
    const { client, calls } = makeStubClient();
    await peopleSearchCommand.handler(
      { q_organization_domains_list: 'apollo.io,stripe.com', page: 1, per_page: 25 },
      client,
    );
    const body = calls[0].body as Record<string, unknown>;
    expect(body.q_organization_domains_list).toEqual(['apollo.io', 'stripe.com']);
  });

  it('people_search splits --title and --seniority and --location into arrays', async () => {
    const { client, calls } = makeStubClient();
    await peopleSearchCommand.handler(
      {
        person_titles: 'VP Sales,Director',
        person_seniorities: 'vp,director',
        person_locations: 'San Francisco,New York',
        page: 1,
        per_page: 10,
      },
      client,
    );
    const body = calls[0].body as Record<string, unknown>;
    expect(body.person_titles).toEqual(['VP Sales', 'Director']);
    expect(body.person_seniorities).toEqual(['vp', 'director']);
    expect(body.person_locations).toEqual(['San Francisco', 'New York']);
  });

  it('people_search omits filters that were not provided', async () => {
    const { client, calls } = makeStubClient();
    await peopleSearchCommand.handler({ page: 1, per_page: 10 }, client);
    const body = calls[0].body as Record<string, unknown>;
    expect(body).toEqual({ page: 1, per_page: 10 });
  });

  it('people_search trims whitespace around commas', async () => {
    const { client, calls } = makeStubClient();
    await peopleSearchCommand.handler(
      { person_titles: 'VP Sales , Director , CEO', page: 1, per_page: 10 },
      client,
    );
    const body = calls[0].body as Record<string, unknown>;
    expect(body.person_titles).toEqual(['VP Sales', 'Director', 'CEO']);
  });

  it('contacts_update splits --labels into label_names array', async () => {
    const { client, calls } = makeStubClient();
    await contactsUpdateCommand.handler(
      { contact_id: 'contact_abc', label_names: 'hot-lead,qualified,vip' },
      client,
    );
    const body = calls[0].body as Record<string, unknown>;
    expect(body.label_names).toEqual(['hot-lead', 'qualified', 'vip']);
  });

  it('contacts_update omits label_names if not provided', async () => {
    const { client, calls } = makeStubClient();
    await contactsUpdateCommand.handler(
      { contact_id: 'contact_abc', title: 'New Title' },
      client,
    );
    const body = calls[0].body as Record<string, unknown>;
    expect(body).not.toHaveProperty('label_names');
    expect(body.title).toBe('New Title');
  });

  it('sequences_add_contacts splits contact_ids into array', async () => {
    const { client, calls } = makeStubClient();
    await sequencesAddContactsCommand.handler(
      { sequence_id: 'seq_1', contact_ids: 'a,b,c' },
      client,
    );
    const body = calls[0].body as Record<string, unknown>;
    expect(body.contact_ids).toEqual(['a', 'b', 'c']);
  });

  it('sequences_remove_contacts splits contact_ids into array', async () => {
    const { client, calls } = makeStubClient();
    await sequencesRemoveContactsCommand.handler(
      { contact_ids: 'x,y', emailer_campaign_id: 'seq_1', action: 'remove' },
      client,
    );
    const body = calls[0].body as Record<string, unknown>;
    expect(body.contact_ids).toEqual(['x', 'y']);
  });

  it('people_bulk_enrich splits emails into array', async () => {
    const { client, calls } = makeStubClient();
    await peopleBulkEnrichCommand.handler({ emails: 'a@x.com,b@x.com' }, client);
    const body = calls[0].body as Record<string, unknown>;
    expect(Array.isArray((body as any).details)).toBe(true);
  });
});
