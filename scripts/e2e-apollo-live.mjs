#!/usr/bin/env node
/**
 * Live end-to-end check: exercises nearly every read path in apollo-agent-cli against Apollo's API.
 *
 * Requires: APOLLO_API_KEY
 *
 *   APOLLO_E2E_SKIP_CREDITS — if "1", skip enrichment / bulk_match / jobs that consume credits
 *   APOLLO_E2E_REPORT_ID     — saved report id for `analytics report` (optional)
 *   APOLLO_E2E_DOMAIN        — domain for prospecting searches (default: apollo.io)
 *
 * A standard API key can run Tier A (search + org satellites + many lists).
 * Master-key endpoints pass if the call succeeds OR the CLI returns MASTER_KEY_REQUIRED.
 *
 * Exit 0 — all steps met acceptance rules. Exit 1 — unexpected failure.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const cli = join(root, 'dist/index.js');

const { values: flags } = parseArgs({
  options: { help: { type: 'boolean', short: 'h' } },
  allowPositionals: false,
});

if (flags.help) {
  console.log(`Usage: node scripts/e2e-apollo-live.mjs
Environment:
  APOLLO_API_KEY (required)
  APOLLO_E2E_SKIP_CREDITS=1  skip credit-consuming enrichment calls
  APOLLO_E2E_REPORT_ID=id   run analytics report smoke
  APOLLO_E2E_DOMAIN=domain  default apollo.io`);
  process.exit(0);
}

if (!process.env.APOLLO_API_KEY) {
  console.error('Missing APOLLO_API_KEY.');
  process.exit(1);
}

const domain = process.env.APOLLO_E2E_DOMAIN || 'apollo.io';
const skipCredits = process.env.APOLLO_E2E_SKIP_CREDITS === '1';

function runApollo(args) {
  const r = spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env },
    maxBuffer: 20 * 1024 * 1024,
  });
  const out = (r.stdout || '').trim();
  const err = (r.stderr || '').trim();
  let errObj = null;
  if (err) {
    try {
      errObj = JSON.parse(err);
    } catch {
      errObj = { raw: err };
    }
  }
  return { status: r.status ?? 1, out, err, errObj, code: errObj?.code };
}

function passesMasterGate(code, status) {
  return status === 0 || code === 'MASTER_KEY_REQUIRED';
}

function parseFirstJsonObject(stdout) {
  if (!stdout) return null;
  const lines = stdout.split('\n').filter(Boolean);
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return JSON.parse(t);
      } catch {
        continue;
      }
    }
  }
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function acceptResult(r, tier) {
  if (tier === 'master') return passesMasterGate(r.code, r.status);
  if (tier === 'credit') {
    return (
      r.status === 0 ||
      r.code === 'VALIDATION_ERROR' ||
      r.code === 'MASTER_KEY_REQUIRED' ||
      r.code === 'NOT_FOUND'
    );
  }
  return r.status === 0;
}

const results = [];
function record(name, step, r, tier, ok) {
  results.push({ name, step, ok, tier, code: r.code, status: r.status });
}

const steps = [];

steps.push({ tier: 'standard', name: 'people search', args: ['people', 'search', '--domain', domain, '--limit', '2'] });
steps.push({ tier: 'standard', name: 'organizations search', args: ['organizations', 'search', '--domain', domain, '--limit', '2'] });
steps.push({ tier: 'standard', name: 'contacts search', args: ['contacts', 'search', '--limit', '2'] });
steps.push({ tier: 'standard', name: 'accounts search', args: ['accounts', 'search', '--limit', '2'] });

if (!skipCredits) {
  steps.push({
    tier: 'credit',
    name: 'organizations enrich',
    args: ['organizations', 'enrich', '--domain', domain],
  });
  steps.push({
    tier: 'credit',
    name: 'people enrich',
    args: ['people', 'enrich', '--first-name', 'Test', '--last-name', 'User', '--domain', domain],
  });
}

steps.push({ tier: 'standard', name: 'labels list', args: ['labels', 'list'] });
steps.push({ tier: 'standard', name: 'lists list', args: ['lists', 'list'] });
steps.push({ tier: 'standard', name: 'contacts stages', args: ['contacts', 'stages'] });
steps.push({ tier: 'standard', name: 'accounts stages', args: ['accounts', 'stages'] });
steps.push({ tier: 'standard', name: 'deals stages', args: ['deals', 'stages'] });

for (const s of [
  ['users list', ['users', 'list']],
  ['deals list', ['deals', 'list', '--limit', '3']],
  ['sequences search', ['sequences', 'search', '--limit', '3']],
  ['tasks search', ['tasks', 'search', '--limit', '3']],
  ['calls search', ['calls', 'search', '--limit', '3']],
  ['emails search', ['emails', 'search', '--limit', '3']],
  ['email-accounts list', ['email-accounts', 'list']],
  ['custom-fields list', ['custom-fields', 'list']],
  ['usage-stats api', ['usage-stats', 'api']],
]) {
  steps.push({ tier: 'master', name: s[0], args: s[1] });
}

if (process.env.APOLLO_E2E_REPORT_ID) {
  steps.push({
    tier: 'master',
    name: 'analytics report',
    args: ['analytics', 'report', '--report-id', process.env.APOLLO_E2E_REPORT_ID],
  });
}

console.log('E2E Apollo live — domain:', domain, skipCredits ? '(credits skipped)' : '');

let orgId = '';
let contactId = '';
let accountId = '';
let dealId = '';
let sequenceId = '';
let taskId = '';
let emailId = '';
let emailAccountId = '';

for (const step of steps) {
  if (step.tier === 'credit' && skipCredits) {
    console.log(`SKIP ${step.name} (APOLLO_E2E_SKIP_CREDITS=1)`);
    record(step.name, step, {}, 'credit', true);
    continue;
  }

  const r = runApollo(step.args);
  const ok = acceptResult(r, step.tier);

  if (!ok) {
    console.error(`FAIL ${step.name}`);
    console.error('stderr:', r.err || '(empty)');
    console.error('args:', step.args.join(' '));
    record(step.name, step, r, step.tier, false);
    continue;
  }

  console.log(`OK   ${step.name}`);
  record(step.name, step, r, step.tier, true);

  const data = parseFirstJsonObject(r.out);
  if (!data || typeof data !== 'object') continue;

  if (step.name === 'organizations search') {
    const row = data.organizations?.[0] ?? data.accounts?.[0];
    if (row?.id) orgId = row.id;
  }
  if (step.name === 'contacts search' && data.contacts?.[0]?.id) contactId = data.contacts[0].id;
  if (step.name === 'accounts search' && data.accounts?.[0]?.id) accountId = data.accounts[0].id;
  if (step.name === 'deals list' && data.opportunities?.[0]?.id) dealId = data.opportunities[0].id;
  if (step.name === 'sequences search' && data.emailer_campaigns?.[0]?.id)
    sequenceId = String(data.emailer_campaigns[0].id);
  if (step.name === 'tasks search' && data.tasks?.[0]?.id) taskId = data.tasks[0].id;
  if (step.name === 'calls search' && (data.phone_calls?.[0]?.id ?? data.calls?.[0]?.id)) {
    const ph = data.phone_calls?.[0] ?? data.calls?.[0];
    if (ph?.id) {
      /* use contact filter later if needed */
    }
  }
  if (step.name === 'emails search' && data.emailer_messages?.[0]?.id)
    emailId = String(data.emailer_messages[0].id);
  if (step.name === 'email-accounts list' && data.email_accounts?.[0]?.id)
    emailAccountId = String(data.email_accounts[0].id);
}

const chained = [];

if (orgId) {
  chained.push({
    tier: 'standard',
    name: 'organizations job-postings',
    args: ['organizations', 'job-postings', orgId, '--limit', '2'],
  });
  chained.push({
    tier: 'standard',
    name: 'organizations news',
    args: ['organizations', 'news', orgId, '--limit', '2'],
  });
  chained.push({
    tier: 'standard',
    name: 'organizations postal-addresses',
    args: ['organizations', 'postal-addresses', orgId],
  });
  chained.push({
    tier: 'master',
    name: 'organizations get',
    args: ['organizations', 'get', orgId],
  });
}

if (contactId) {
  chained.push({ tier: 'standard', name: 'contacts get', args: ['contacts', 'get', contactId] });
}

if (accountId) {
  chained.push({ tier: 'standard', name: 'accounts get', args: ['accounts', 'get', accountId] });
}

if (dealId) {
  chained.push({ tier: 'master', name: 'deals get', args: ['deals', 'get', dealId] });
}

if (sequenceId) {
  chained.push({ tier: 'master', name: 'sequences get', args: ['sequences', 'get', sequenceId] });
  chained.push({
    tier: 'master',
    name: 'sequences steps-list',
    args: ['sequences', 'steps-list', sequenceId],
  });
}

if (taskId) {
  chained.push({ tier: 'master', name: 'tasks get', args: ['tasks', 'get', taskId] });
}

if (emailId) {
  chained.push({ tier: 'master', name: 'emails activities', args: ['emails', 'activities', emailId] });
}

if (emailAccountId) {
  chained.push({
    tier: 'master',
    name: 'email-accounts get',
    args: ['email-accounts', 'get', emailAccountId],
  });
}

for (const step of chained) {
  const r = runApollo(step.args);
  const ok = acceptResult(r, step.tier);
  if (!ok) {
    console.error(`FAIL ${step.name}`);
    console.error('stderr:', r.err || '(empty)');
    record(step.name, step, r, step.tier, false);
    continue;
  }
  console.log(`OK   ${step.name}`);
  record(step.name, step, r, step.tier, true);
}

if (!skipCredits) {
  const bulk = runApollo(['people', 'bulk-enrich', '--emails', 'e2e.smoke@example.invalid']);
  const bulkOk =
    bulk.status === 0 ||
    bulk.code === 'MASTER_KEY_REQUIRED' ||
    bulk.code === 'VALIDATION_ERROR' ||
    (bulk.err && /email|invalid|not found|unable|match/i.test(bulk.err));
  if (bulkOk) {
    console.log('OK   people bulk-enrich (API responded / validation path exercised)');
    record('people bulk-enrich', { args: [] }, bulk, 'credit', true);
  } else {
    console.error('FAIL people bulk-enrich', bulk.err?.slice(0, 400));
    record('people bulk-enrich', {}, bulk, 'credit', false);
  }
}

const hardFails = results.filter((x) => x.ok === false);
console.log('\n--- Summary ---');
console.log(`Steps: ${results.length}  Failed: ${hardFails.length}`);

if (hardFails.length) {
  for (const f of hardFails) console.error(`- ${f.name}`);
  process.exit(1);
}

console.log('All e2e steps passed acceptance rules.');
console.log(`
Not exercised in this script (writes / complex state):
  contacts|accounts create/update/bulk, deals create/update, sequences add/remove/activate,
  organizations bulk-enrich, tasks create/update, calls create, contacts update-stages/labels, etc.
Run those manually against a sandbox workspace when needed.
Apollo may add new REST resources not yet wrapped — see docs.apollo.io vs src/commands/.
`);
process.exit(0);
