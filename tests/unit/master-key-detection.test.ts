import { describe, it, expect } from 'vitest';
import { isMasterKeyEndpoint, MASTER_KEY_PATTERNS } from '../../src/core/client.js';

describe('isMasterKeyEndpoint', () => {
  describe('accounts', () => {
    it('flags POST /accounts as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/accounts')).toBe(true);
    });

    it('does NOT flag POST /accounts/search as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/accounts/search')).toBe(false);
    });

    it('flags PATCH /accounts/{id} as master-key', () => {
      expect(isMasterKeyEndpoint('PATCH', '/accounts/abc123')).toBe(true);
    });

    it('flags POST /accounts/bulk_create as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/accounts/bulk_create')).toBe(true);
    });

    it('flags POST /accounts/bulk_update as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/accounts/bulk_update')).toBe(true);
    });
  });

  describe('contacts', () => {
    it('does NOT flag POST /contacts/search as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/contacts/search')).toBe(false);
    });

    it('does NOT flag POST /contacts (create) as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/contacts')).toBe(false);
    });

    it('does NOT flag PATCH /contacts/{id} (update) as master-key', () => {
      expect(isMasterKeyEndpoint('PATCH', '/contacts/abc123')).toBe(false);
    });

    it('flags POST /contacts/bulk_update as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/contacts/bulk_update')).toBe(true);
    });

    it('flags POST /contacts/update_labels as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/contacts/update_labels')).toBe(true);
    });
  });

  describe('organizations', () => {
    it('flags GET /organizations/{24-hex-id} as master-key', () => {
      const hexId = '5e66b6381e05b40010101010';
      expect(isMasterKeyEndpoint('GET', `/organizations/${hexId}`)).toBe(true);
    });

    it('does NOT flag GET /organizations/enrich as master-key', () => {
      expect(isMasterKeyEndpoint('GET', '/organizations/enrich')).toBe(false);
    });

    it('does NOT flag POST /organizations/bulk_enrich as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/organizations/bulk_enrich')).toBe(false);
    });

    it('does NOT flag POST /mixed_companies/search as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/mixed_companies/search')).toBe(false);
    });
  });

  describe('sequences', () => {
    it('flags POST /emailer_campaigns/search as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/emailer_campaigns/search')).toBe(true);
    });

    it('flags GET /emailer_campaigns/{id} as master-key', () => {
      expect(isMasterKeyEndpoint('GET', '/emailer_campaigns/seq_abc123')).toBe(true);
    });
  });

  describe('deals (opportunities)', () => {
    it('flags POST /opportunities (create) as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/opportunities')).toBe(true);
    });

    it('flags PATCH /opportunities/{id} as master-key', () => {
      expect(isMasterKeyEndpoint('PATCH', '/opportunities/op_123')).toBe(true);
    });

    it('flags POST /opportunities/search as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/opportunities/search')).toBe(true);
    });
  });

  describe('users / email-accounts / tasks / calls', () => {
    it('flags GET /users/search as master-key', () => {
      expect(isMasterKeyEndpoint('GET', '/users/search')).toBe(true);
    });

    it('flags GET /email_accounts as master-key', () => {
      expect(isMasterKeyEndpoint('GET', '/email_accounts')).toBe(true);
    });

    it('flags POST /tasks/search as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/tasks/search')).toBe(true);
    });

    it('flags POST /phone_calls (log call) as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/phone_calls')).toBe(true);
    });
  });

  describe('analytics', () => {
    it('flags POST /reports/sync_report as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/reports/sync_report')).toBe(true);
    });

    it('flags POST /usage_stats/api_usage_stats as master-key', () => {
      expect(isMasterKeyEndpoint('POST', '/usage_stats/api_usage_stats')).toBe(true);
    });
  });

  describe('coverage', () => {
    it('has a non-empty pattern list', () => {
      expect(MASTER_KEY_PATTERNS.length).toBeGreaterThan(10);
    });

    it('does NOT flag random non-Apollo paths', () => {
      expect(isMasterKeyEndpoint('GET', '/some/random/path')).toBe(false);
      expect(isMasterKeyEndpoint('POST', '/foo/bar')).toBe(false);
    });
  });
});
