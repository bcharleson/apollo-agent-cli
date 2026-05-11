# Apollo Agent CLI

**Apollo.io in your terminal.** Prospect, enrich, manage contacts and accounts, run sequences, and track deals — all from a single command line.

55 commands across 16 API groups. Full coverage of [Apollo.io](https://apollo.io)'s documented REST API. Built for humans, scripts, CI/CD pipelines, and AI agents.

```bash
npm install -g apollo-agent-cli
```

> **Why `apollo-agent-cli` and not `apollo-cli`?** The `apollo-cli` and `apollo` npm names are taken by Apollo GraphQL's tooling. We follow the convention of the `bcharleson` agent-CLI portfolio: when an official CLI owns the obvious name, we suffix with `-agent-cli`. The binary is still `apollo`.

---

## What is Apollo.io?

[Apollo.io](https://apollo.io) is the leading sales intelligence and engagement platform. It combines a 275M+ person B2B database with the CRM, sequences, and analytics needed to run outbound at scale:

- **Prospecting** — search 275M+ contacts and 60M+ companies, filter by title, industry, headcount, location, or tech stack
- **Enrichment** — verify emails, find phones, append firmographics, and detect hiring intent signals
- **CRM** — manage contacts, accounts, and deals with custom fields, stages, and labels
- **Sequences** — multi-step email outreach with A/B testing, scheduling, and contact-stage automation
- **Engagement** — log calls, track opens/replies, and manage your team's pipeline
- **Reporting** — pull analytics on sequences, deals, and team performance

## What This CLI Enables

Every action you can take in the Apollo dashboard, you can now do from your terminal:

**Prospecting** — search Apollo's database, enrich leads in bulk, find emails and phones, and identify intent signals (job postings, news mentions) — all scriptable.

**CRM operations** — create contacts and accounts, update stages and labels in bulk, manage custom fields, and read full records for any contact, account, or deal.

**Sequence orchestration** — search sequences, add or remove contacts, activate or deactivate, archive, and inspect step-by-step content.

**Pipeline management** — list, create, update, and report on deals (opportunities). Move deals through pipeline stages programmatically.

**Team analytics** — pull saved reports, monitor API usage, list team users, and inspect connected sending inboxes.

**AI agent integration** — every command works as both a CLI subcommand and an MCP tool, so AI assistants (Claude, Cursor, Windsurf) can drive your Apollo workspace directly.

---

## Install

### npm (recommended)

```bash
npm install -g apollo-agent-cli
```

### npx (zero-install)

```bash
npx apollo-agent-cli people search --domain apollo.io
```

### From source

```bash
git clone https://github.com/bcharleson/apollo-agent-cli.git
cd apollo-agent-cli
npm install && npm run build
npm link
```

---

## Authentication

Three ways to authenticate, checked in this order:

1. **`--api-key` flag** — pass on any command: `apollo people search --api-key <key>`
2. **Environment variable** — `export APOLLO_API_KEY=your-key`
3. **Stored config** — run `apollo login` to save your key to `~/.apollo-cli/config.json` (file mode `0600`)

Get your API key from [app.apollo.io/#/settings/integrations/api](https://app.apollo.io/#/settings/integrations/api).

### Master API key

About half of Apollo's endpoints (writes to accounts, deals, sequences, tasks, calls, users, email-accounts, analytics) require a **master API key**. The CLI detects 403 responses on those endpoints and surfaces a clear error:

```bash
$ apollo deals create --name "Acme Q1" --account-id acc_123
Error: This endpoint requires a master API key: /opportunities
Enable it in Apollo → Settings → Integrations → API → Edit key → "Set as master key"
```

Endpoints requiring a master key are noted as `[master key]` in the command listing below.

---

## Quick Start

```bash
# Authenticate
apollo login

# Search Apollo's 275M+ database (free, no credits consumed)
apollo people search --domain stripe.com --title "VP Engineering" --limit 10

# Enrich a single lead (consumes credits)
apollo people enrich --email founder@stripe.com --reveal-emails

# Find companies by criteria
apollo organizations search --keywords "SaaS" --employee-range "201,500" --limit 25

# Add a contact to your CRM
apollo contacts create --first-name Patrick --last-name Collison --email pc@stripe.com

# Add to a sequence (master key)
apollo sequences add-contacts <sequence-id> --contact-ids "<contact-id>"

# Track deals (master key)
apollo deals list --limit 10
```

---

## Output Formats

Every command outputs JSON by default — ready for piping to `jq`, parsing in scripts, or feeding to AI agents.

```bash
# Default: compact JSON
apollo contacts search

# Pretty-printed JSON
apollo contacts search --pretty

# Plain-text table (for terminals)
apollo contacts search --output table

# Select specific fields
apollo contacts search --fields "id,name,email,title"

# Suppress output (exit code only)
apollo contacts search --quiet
```

---

## Commands

### People (3) — Apollo's 275M+ Database

Search and enrich prospects from Apollo's public database (separate from your CRM).

```bash
apollo people search --domain apollo.io --title "VP Sales" --limit 25
apollo people search --keywords "fintech" --seniority "director,vp" --location "San Francisco"
apollo people enrich --email founder@stripe.com                # Single enrichment (credits)
apollo people enrich --linkedin-url https://linkedin.com/in/x  # Match by LinkedIn
apollo people bulk-enrich --emails "a@x.com,b@x.com,c@x.com"   # Up to 10 at once
```

> `people search` is FREE (no credits). `people enrich` and `people bulk-enrich` consume credits per match.

### Contacts (8) — Your CRM Contacts

```bash
apollo contacts search --limit 50                              # Search your CRM
apollo contacts get <contact-id>                               # Read single contact
apollo contacts create --first-name John --last-name Smith --email j@co.com
apollo contacts update <contact-id> --title "VP Engineering"
apollo contacts bulk-update --contacts '[{"id":"c1","title":"CTO"}]'   # [master key]
apollo contacts update-stages --contact-ids "c1,c2" --stage-id "stg_x"
apollo contacts update-labels --contact-ids "c1,c2" --labels "hot,vip" # [master key]
apollo contacts stages                                         # Discover stage IDs
```

### Accounts (8) — Your CRM Accounts

```bash
apollo accounts search --limit 50
apollo accounts get <account-id>                                # [master key]
apollo accounts create --name "Acme Corp" --domain acme.com    # [master key]
apollo accounts update <account-id> --name "Acme Corporation"  # [master key]
apollo accounts bulk-create --accounts '[{"name":"X","domain":"x.com"}]' # [master key]
apollo accounts bulk-update --accounts '[{"id":"a1","name":"X"}]'        # [master key]
apollo accounts update-labels --account-ids "a1,a2" --labels "tier1"     # [master key]
apollo accounts stages                                          # Discover stage IDs
```

### Organizations (7) — Company Intelligence

```bash
apollo organizations search --keywords "saas" --employee-range "201,500"  # Free, no credits
apollo organizations enrich --domain stripe.com                # Single enrich (credits)
apollo organizations bulk-enrich --domains "stripe.com,plaid.com"
apollo organizations get <organization-id>                     # [master key] (credits)
apollo organizations job-postings <organization-id>            # Hiring intent signal
apollo organizations news <organization-id>                    # Recent news / outreach hooks
apollo organizations postal-addresses <organization-id>        # HQ + offices
```

### Sequences (8) — Email Outreach `[master key]`

> Apollo's API uses `emailer_campaigns` internally; the CLI aliases this to `sequences` for clarity.

```bash
apollo sequences search                                        # List sequences
apollo sequences get <sequence-id>                             # Read single sequence
apollo sequences add-contacts <sequence-id> --contact-ids "c1,c2"
apollo sequences remove-contacts --sequence-id <id> --contact-ids "c1"
apollo sequences activate <sequence-id>                        # Approve & start
apollo sequences deactivate <sequence-id>                      # Pause without removing contacts
apollo sequences archive <sequence-id>                         # Archive sequence
apollo sequences steps-list <sequence-id>                      # Inspect step-by-step content
```

### Emails (2) — Outreach Tracking `[master key]`

```bash
apollo emails search --contact-id "contact_abc" --limit 50
apollo emails activities <email-id>                            # Opens, clicks, bounces
```

### Deals (5) — Pipeline / Opportunities `[master key]`

> Apollo's API uses `opportunities` internally; the CLI aliases this to `deals`.

```bash
apollo deals list --limit 25                                   # Search deals
apollo deals list --stage-id <id> --owner-id <user-id>
apollo deals get <deal-id>                                     # Single deal record
apollo deals create --name "Acme Q1" --account-id "acc_abc" --amount 50000
apollo deals update <deal-id> --stage-id "stage_closed_won"
apollo deals stages                                            # Discover stage IDs
```

### Tasks (4) — Tasks & To-Dos `[master key]`

```bash
apollo tasks search --type call --limit 50
apollo tasks get <task-id>
apollo tasks create --type call --contact-id "c1" --due-date "2026-04-01"
apollo tasks update <task-id> --status completed
```

### Calls (2) — Call Records `[master key]`

```bash
apollo calls search --contact-id "contact_abc" --limit 50
apollo calls create --contact-id "c1" --duration 300 --outcome "connected"
```

### Users (1) — Team Members `[master key]`

```bash
apollo users list                                              # Discover user IDs
apollo users list --fields id,name,email
```

### Email Accounts (2) — Sending Inboxes `[master key]`

```bash
apollo email-accounts list                                     # All connected inboxes
apollo email-accounts get <email-account-id>                   # Single inbox details
```

### Custom Fields (1) `[master key]`

```bash
apollo custom-fields list                                      # All typed custom fields
```

### Labels (1)

```bash
apollo labels list                                             # All workspace labels
```

### Lists (1)

```bash
apollo lists list                                              # Static lead lists
```

### Analytics (1) — Saved Reports `[master key]`

```bash
apollo analytics report --report-id "rpt_abc"                  # Run saved report
```

### Usage Stats (1) — API Telemetry `[master key]`

```bash
apollo usage-stats api                                         # Workspace API usage
```

### Auth

```bash
apollo login                                                   # Interactive
apollo login --api-key <key>                                   # Non-interactive
apollo logout                                                  # Clear stored config
```

---

## MCP Server

The CLI doubles as an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server, giving AI assistants direct access to all 55 Apollo tools as native function calls.

```bash
apollo mcp
```

### What this means

When you configure `apollo mcp` as an MCP server in Claude, Cursor, VS Code, or Windsurf, your AI assistant can:

- Search and enrich prospects mid-conversation
- Create contacts and accounts directly in your Apollo workspace
- Run analytics and pipeline reports on demand
- Add prospects to sequences and track deals end-to-end

Every `CommandDefinition` powers both a CLI subcommand and an MCP tool — one source of truth.

### Configuration

Add to your MCP settings (Claude Desktop, Cursor, VS Code, Windsurf):

```json
{
  "mcpServers": {
    "apollo": {
      "command": "npx",
      "args": ["apollo-agent-cli", "mcp"],
      "env": {
        "APOLLO_API_KEY": "your-api-key"
      }
    }
  }
}
```

This registers 55 tools across 16 groups:

| Group | Tools | Examples |
|-------|-------|----------|
| people | 3 | `people_search`, `people_enrich`, `people_bulk_enrich` |
| contacts | 8 | `contacts_search`, `contacts_get`, `contacts_create`, `contacts_bulk_update` |
| accounts | 8 | `accounts_search`, `accounts_create`, `accounts_bulk_create`, `accounts_stages` |
| organizations | 7 | `organizations_search`, `organizations_enrich`, `organizations_news` |
| sequences | 8 | `sequences_search`, `sequences_add_contacts`, `sequences_activate`, `sequences_archive` |
| emails | 2 | `emails_search`, `emails_activities` |
| deals | 5 | `deals_list`, `deals_get`, `deals_create`, `deals_stages` |
| tasks | 4 | `tasks_search`, `tasks_get`, `tasks_create`, `tasks_update` |
| calls | 2 | `calls_search`, `calls_create` |
| users | 1 | `users_list` |
| email-accounts | 2 | `email_accounts_list`, `email_accounts_get` |
| custom-fields | 1 | `custom_fields_list` |
| labels | 1 | `labels_list` |
| lists | 1 | `lists_list` |
| analytics | 1 | `analytics_report` |
| usage-stats | 1 | `usage_stats_api` |

---

## Pagination

Apollo uses **page-number pagination** (`page` + `per_page`):

```bash
apollo contacts search --page 1 --limit 100
apollo contacts search --page 2 --limit 100
```

Max: 100 per page, up to 500 pages (50,000 records) per search. When `pagination_info.has_more` is `false`, you've reached the end.

---

## Example Workflows

### Prospect → Enrich → Add to sequence

```bash
export APOLLO_API_KEY=your-key

# 1. Find prospects (free)
PROSPECTS=$(apollo people search --domain stripe.com --title "VP Sales" --limit 5)

# 2. Pick an email and create a CRM contact
apollo contacts create --first-name Pat --last-name C --email pat@stripe.com

# 3. Find the contact ID we just created
CID=$(apollo contacts search --q-keywords "pat@stripe.com" --fields id | jq -r '.[0].id')

# 4. Add to sequence (master key)
apollo sequences add-contacts seq_abc --contact-ids "$CID"
```

### Company intelligence before outreach

```bash
# Enrich the company
apollo organizations enrich --domain stripe.com --pretty

# Check for hiring intent
apollo organizations job-postings <org-id> --limit 10 --fields title,location

# Look for recent news
apollo organizations news <org-id> --limit 5
```

### Deal pipeline management

```bash
# List active deals
apollo deals list --stage-id stage_active --limit 25

# Move a deal to closed won
apollo deals update deal_xyz --stage-id stage_closed_won --close-date 2026-04-30

# Pull a saved analytics report
apollo analytics report --report-id rpt_pipeline_q1 --pretty
```

### Daily inbox + sequence health (cron)

```bash
# Daily sequence stats (add to crontab)
0 9 * * * APOLLO_API_KEY=... apollo sequences search --pretty >> /var/log/apollo.json

# Watch for API quota exhaustion
*/15 * * * * APOLLO_API_KEY=... apollo usage-stats api | jq '.api_usage'
```

---

## What's NOT Available (Apollo Platform Limitations)

The following are not currently exposed by Apollo's public REST API. They are not gaps in the CLI; they are intentional limits of the Apollo platform:

- **Webhooks CRUD** — Apollo's webhooks are configured in-app only
- **Saved Searches CRUD** — read/write of saved search definitions is private
- **Stage CRUD** — only `GET` is documented for `opportunity_stages`, `contact_stages`, `account_stages`
- **Lead List CRUD** — only `GET /lists` is documented
- **DELETE endpoints** — none documented for the public API

If Apollo adds these, they'll be added here.

---

## Architecture

The CLI uses a **CommandDefinition** pattern where every API endpoint is defined as a single object that powers both the CLI subcommand and the MCP tool:

```
src/
├── core/
│   ├── client.ts      # HTTP client (x-api-key, retry, master-key detection)
│   ├── auth.ts        # API key resolution (flag → env → config)
│   ├── output.ts      # JSON/pretty/table formatting, --fields filtering
│   ├── handler.ts     # executeCommand() — generic request builder
│   ├── errors.ts      # Typed errors (incl. MasterKeyError)
│   └── types.ts       # CommandDefinition interface
├── commands/
│   ├── people/        # 3 commands
│   ├── contacts/      # 8 commands
│   ├── accounts/      # 8 commands
│   └── ...            # 13 more groups
└── mcp/
    └── server.ts      # MCP server (auto-registers all commands as tools)
```

Adding a new endpoint = creating one file. The command is automatically available in both CLI and MCP.

### HTTP Client Features

- **`x-api-key` auth** (NOT Bearer token — Apollo-specific)
- **Auto-retry** with exponential backoff on 429 and 5xx
- **Rate-limit awareness** — respects `Retry-After` header
- **30-second timeout** for reads, 15-second for writes (no retry on write timeouts)
- **Master-key detection** — surfaces `MasterKeyError` with actionable instructions on 403s for known master-key endpoints
- **Typed errors** — `AuthError`, `NotFoundError`, `RateLimitError`, `ValidationError`, `ServerError`, `MasterKeyError`

---

## Development

```bash
git clone https://github.com/bcharleson/apollo-agent-cli.git
cd apollo-agent-cli
npm install

npm run dev -- people search          # Dev mode (tsx)
npm run build                         # Build with tsup
npm test                              # 95 tests, no API key required
npm run typecheck                     # tsc --noEmit
```

### Tech Stack

- **TypeScript** (ESM, Node 18+)
- **Commander.js** — CLI framework
- **Zod v4** — schema validation (shared between CLI and MCP)
- **@modelcontextprotocol/sdk** — MCP server
- **tsup** — bundler
- **vitest** — test runner

---

## License

MIT
