# Apollo CLI — Agent Reference

A dual-purpose CLI and MCP server wrapping the entire documented [Apollo.io](https://apollo.io) REST API.
55 commands across 16 groups — prospect, enrich, manage CRM, run sequences, track deals, and pull analytics from the terminal or an AI agent.

---

## Quick Start

```bash
# Install
npm install -g apollo-agent-cli

# Authenticate (interactive)
apollo login

# Or non-interactive
apollo login --api-key YOUR_KEY
# or
export APOLLO_API_KEY=YOUR_KEY

# Verify (requires master key)
apollo users list --pretty
```

---

## Authentication

**API key resolution order (highest to lowest priority):**
1. `--api-key` CLI flag
2. `APOLLO_API_KEY` environment variable
3. `~/.apollo-cli/config.json` (written by `apollo login`, mode `0600`)

**Get your key:** https://app.apollo.io/#/settings/integrations/api

### Master API Key

About half of Apollo's endpoints require a **master API key**. The CLI automatically raises a `MasterKeyError` with clear instructions when you hit one.

To enable: Apollo → Settings → Integrations → API → Edit key → "Set as master key".

Commands requiring master key are flagged below with `[master key]`.

---

## Output Format

All commands output **JSON to stdout** (machine-readable by default).

```bash
apollo contacts search                    # compact JSON (default)
apollo contacts search --pretty           # pretty-printed JSON
apollo contacts search --output table     # plain-text table
apollo contacts search --quiet            # suppress output, exit codes only
apollo contacts search --fields id,name,email  # select specific fields
```

**Exit codes:**
- `0` — success
- `1` — error (details in stderr as JSON)

**Stderr format on error:**
```json
{"error": "human-readable message", "code": "ERROR_CODE"}
```

---

## Discovering Commands

```bash
apollo --help                       # top-level help
apollo people --help                # group help
apollo people search --help         # command help with examples
```

---

## All Commands (55 across 16 groups)

### `apollo people` — Prospect & Enrich (3)

```bash
# Search Apollo's 275M+ database (NO credits consumed)
apollo people search --domain salesforce.com --title "VP Sales" --limit 25
apollo people search --keywords "fintech" --seniority "director,vp"
apollo people search --employee-range "201,500" --email-status verified

# Enrich a single person (credits consumed)
apollo people enrich --email john@example.com
apollo people enrich --linkedin-url https://linkedin.com/in/johndoe
apollo people enrich --first-name John --last-name Smith --domain example.com
apollo people enrich --email john@example.com --reveal-emails

# Bulk enrich up to 10 people (credits consumed)
apollo people bulk-enrich --emails "john@a.com,jane@b.com,bob@c.com"
apollo people bulk-enrich --linkedin-urls "https://linkedin.com/in/a,https://linkedin.com/in/b"
```

**Notes:**
- `people search` does NOT return emails/phones — use `people enrich` for those.
- `--reveal-phone` is async and requires `--webhook-url` for delivery.

---

### `apollo contacts` — Your CRM Contacts (8)

```bash
# Search and read your team's contacts
apollo contacts search --limit 50
apollo contacts search --q-keywords "VP Sales"
apollo contacts get <contact-id>
apollo contacts stages                    # Discover stage IDs

# Create / update / bulk write
apollo contacts create --first-name John --last-name Smith --email john@co.com
apollo contacts create --first-name Bob --last-name Jones --email bob@co.com --no-dedupe
apollo contacts update <contact-id> --title "VP Engineering"
apollo contacts update <contact-id> --labels "hot-lead,qualified"

# Bulk operations [master key]
apollo contacts bulk-update --contacts '[{"id":"c1","title":"CTO"},{"id":"c2","title":"VP"}]'
apollo contacts update-stages --contact-ids "id1,id2,id3" --stage-id "stage_abc"
apollo contacts update-labels --contact-ids "c1,c2" --labels "hot,vip"
apollo contacts update-labels --contact-ids "c1" --labels "stale" --remove
```

---

### `apollo accounts` — Your CRM Accounts (8)

```bash
# Search and read
apollo accounts search --limit 50
apollo accounts search --q-keywords "SaaS startup"
apollo accounts get <account-id>                                  # [master key]
apollo accounts stages

# Create / update / bulk write [all master key]
apollo accounts create --name "Acme Corp" --domain acme.com
apollo accounts update <account-id> --name "Acme Corporation"
apollo accounts bulk-create --accounts '[{"name":"Acme","domain":"acme.com"}]'
apollo accounts bulk-update --accounts '[{"id":"a1","name":"Acme Inc"}]'
apollo accounts update-labels --account-ids "a1,a2" --labels "tier1,strategic"
```

---

### `apollo organizations` — Company Intelligence (7)

```bash
# Search Apollo's company database (NO credits consumed)
apollo organizations search --keywords "saas" --employee-range "201,500"
apollo organizations search --domain stripe.com

# Enrich (credits consumed)
apollo organizations enrich --domain apollo.io
apollo organizations bulk-enrich --domains "apollo.io,salesforce.com,hubspot.com"

# Get deep profile by ID  [master key] (credits consumed)
apollo organizations get <organization-id>

# Intent / outreach signals
apollo organizations job-postings <organization-id>
apollo organizations news <organization-id>                       # Recent articles
apollo organizations postal-addresses <organization-id>           # HQ + offices
```

---

### `apollo sequences` — Email Sequences `[master key]` (8)

> Apollo's API uses `emailer_campaigns` internally; the CLI aliases this to `sequences`.

```bash
# Read
apollo sequences search
apollo sequences search --q-keywords "Cold Outreach" --limit 25
apollo sequences get <sequence-id>
apollo sequences steps-list <sequence-id>

# Add / remove contacts
apollo sequences add-contacts <sequence-id> --contact-ids "id1,id2,id3"
apollo sequences add-contacts <sequence-id> --contact-ids "id1" --email-account-id "inbox_id"
apollo sequences remove-contacts --sequence-id <id> --contact-ids "id1,id2"
apollo sequences remove-contacts --sequence-id <id> --contact-ids "id1" --action finished

# Lifecycle
apollo sequences activate <sequence-id>
apollo sequences deactivate <sequence-id>          # Pause without removing contacts
apollo sequences archive <sequence-id>
```

---

### `apollo emails` — Outreach Email Tracking `[master key]` (2)

```bash
apollo emails search --limit 50
apollo emails search --contact-id "contact_abc"
apollo emails search --sequence-id "seq_abc"
apollo emails activities <email-id>                # Opens, clicks, bounces
```

---

### `apollo deals` — Pipeline / Opportunities `[master key]` (5)

```bash
apollo deals list --limit 25                                       # Search deals
apollo deals list --stage-id <id> --owner-id <user-id>
apollo deals get <deal-id>
apollo deals stages                                                # Discover stage IDs

apollo deals create --name "Acme Q1" --account-id "acc_abc"
apollo deals create --name "BigCo" --account-id "acc_xyz" --amount 50000 --owner-id "user_123"
apollo deals update <deal-id> --amount 75000
apollo deals update <deal-id> --stage-id "stage_closed_won" --close-date "2026-03-31"
```

---

### `apollo tasks` — Tasks & To-Dos `[master key]` (4)

```bash
apollo tasks search
apollo tasks search --type call --limit 50
apollo tasks search --owner-id "user_abc"
apollo tasks get <task-id>

apollo tasks create --type call --contact-id "contact_abc" --due-date "2026-04-01"
apollo tasks create --type email --contact-id "contact_abc" --note "Follow up on demo" --priority high
apollo tasks update <task-id> --status completed
apollo tasks update <task-id> --due-date "2026-04-30" --note "Rescheduled"
```

---

### `apollo calls` — Call Records `[master key]` (2)

```bash
apollo calls search
apollo calls search --contact-id "contact_abc" --limit 50
apollo calls create --contact-id "contact_abc" --duration 300 --outcome "connected"
apollo calls create --contact-id "contact_abc" --duration 120 --note "Discussed pricing"
```

---

### `apollo users` — Team Members `[master key]` (1)

```bash
apollo users list
apollo users list --fields id,name,email
```

---

### `apollo email-accounts` — Sending Inboxes `[master key]` (2)

```bash
apollo email-accounts list
apollo email-accounts list --fields id,email,name
apollo email-accounts get <email-account-id>
```

---

### `apollo custom-fields` — Typed Custom Fields `[master key]` (1)

```bash
apollo custom-fields list
apollo custom-fields list --fields id,name,modality
```

---

### `apollo labels` — Workspace Labels (1)

```bash
apollo labels list
apollo labels list --fields id,name
```

---

### `apollo lists` — Static Lead Lists (1)

```bash
apollo lists list
```

> Note: Apollo does not expose CRUD operations for lists via the public REST API.

---

### `apollo analytics` — Saved Reports `[master key]` (1)

```bash
apollo analytics report --report-id "rpt_abc123"
apollo analytics report --report-id "rpt_abc123" --pretty
```

---

### `apollo usage-stats` — API Telemetry `[master key]` (1)

```bash
apollo usage-stats api
apollo usage-stats api --pretty
```

---

## Pagination

Apollo uses **page-number pagination** (`page` + `per_page`):

```bash
apollo contacts search --page 1 --limit 100
apollo contacts search --page 2 --limit 100
apollo contacts search --page 3 --limit 100
```

Max: 100 per page, up to 500 pages (50,000 total records) per search.
When `pagination_info.has_more` is `false`, you've reached the end.

---

## Common Agent Workflows

### Workflow 1: Prospect → Enrich → Add to Sequence

```bash
# 1. Search for prospects (free)
apollo people search --domain target.com --title "VP Sales" | jq '.people[] | .id'

# 2. Create contacts in your CRM
apollo contacts create --email prospect@target.com --first-name Jane --last-name Doe

# 3. Get the contact ID from your CRM
apollo contacts search --q-keywords "Jane Doe" --fields id,email

# 4. Add to sequence (master key)
apollo sequences add-contacts <sequence-id> --contact-ids "<contact-id>"
```

### Workflow 2: Enrich a Lead List

```bash
# Enrich up to 10 at a time
apollo people bulk-enrich --emails "a@co.com,b@co.com,c@co.com,d@co.com,e@co.com"

# Single enrichment for full profile
apollo people enrich --email ceo@bigco.com --reveal-emails --pretty
```

### Workflow 3: Company Intelligence Before Outreach

```bash
# Enrich + search for intent signals
apollo organizations enrich --domain bigco.com --pretty
apollo organizations job-postings <org-id> --limit 10 --fields title,location,posted_date
apollo organizations news <org-id> --limit 5
```

### Workflow 4: Deal Pipeline Management

```bash
apollo users list --fields id,name,email                          # Get owner IDs
apollo deals stages --fields id,display_name                      # Get stage IDs

apollo deals create --name "BigCo Enterprise" --account-id "acc_xyz" --amount 120000 --owner-id "user_abc"
apollo deals update <deal-id> --stage-id "stage_negotiation"
apollo deals update <deal-id> --stage-id "stage_closed_won" --close-date "2026-04-15"

apollo deals list --stage-id "stage_active" --limit 25            # Snapshot of active pipeline
```

### Workflow 5: Bulk CRM Updates

```bash
# Bulk update contact stages
apollo contacts stages                                            # Find stage IDs
apollo contacts update-stages --contact-ids "c1,c2,c3" --stage-id "stage_qualified"

# Bulk apply labels
apollo contacts update-labels --contact-ids "c1,c2" --labels "hot-lead,qualified"

# Bulk update arbitrary fields
apollo contacts bulk-update --contacts '[
  {"id":"c1","title":"VP Engineering"},
  {"id":"c2","title":"CTO","email":"new@email.com"}
]'
```

---

## MCP Server

Run as an MCP server for use with Claude, Cursor, or any MCP-compatible AI:

```bash
# Start MCP server (stdio transport)
apollo mcp
# or
node dist/mcp.js
```

**Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "apollo": {
      "command": "npx",
      "args": ["apollo-agent-cli", "mcp"],
      "env": {
        "APOLLO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Claude Code (CLI):**
```bash
claude mcp add apollo -- npx apollo-agent-cli mcp
```

All 55 CLI commands are registered as MCP tools with snake_case names matching `<group>_<subcommand>` (e.g., `people_search`, `contacts_create`, `deals_list`).

---

## Rate Limits

Apollo rate limits are per-plan. Typical paid plan:
- ~200 requests/minute per endpoint
- Contact updates: 600/hour
- Bulk operations: ~10/minute

The client automatically retries on 429 with exponential backoff (3 retries max, up to 10s delay).

Check your exact limits:
```bash
apollo usage-stats api --pretty                                   # Requires master key
```

---

## Tips for AI Agents

1. **Check exit codes** — `0` = success, `1` = error. Read stderr JSON for error details.
2. **Use `--fields` to reduce payload size** — `--fields id,email,name` is faster to parse than full records.
3. **`people search` ≠ contacts** — prospects from search are NOT in your CRM. Create them with `contacts create` first before adding to sequences.
4. **Deduplication** — `contacts create` has dedup ON by default. Pass `--no-dedupe` only if you've already deduped upstream.
5. **Master key errors** — `MASTER_KEY_REQUIRED` means the key needs to be promoted in Apollo Settings. Not a permissions issue, just a key type issue.
6. **Phone enrichment is async** — `--reveal-phone` delivers results to a webhook URL, not inline. Don't wait for it in the same call.
7. **Credits** — `people search`, `organizations search`, `contacts search`, `accounts search` are FREE. `people enrich`, `organizations enrich`, and `organizations get` consume credits per match.
8. **Sequence API name** — Apollo's API uses `emailer_campaigns` internally. The CLI maps this to `sequences` for readability.
9. **Pagination max** — Apollo caps at 50,000 records per search (500 pages × 100 per page). Use filters to narrow results.
10. **Pipe to jq** — all output is JSON, works natively with `jq` for field extraction and transformation.
11. **Discover IDs first** — before calling `deals update --stage-id` or `contacts update-stages --stage-id`, run `apollo deals stages` / `apollo contacts stages` / `apollo accounts stages` to discover valid IDs.

---

## Platform Limitations (Not Available via Public API)

These are Apollo platform limitations, not CLI gaps. The CLI does NOT wrap them because Apollo does not document them publicly:

- Webhooks CRUD (Apollo's webhooks are configured in-app only)
- Saved Searches CRUD
- Stage CRUD (only `GET` is documented for stage endpoints)
- Lead List CRUD (only `GET /lists` is documented)
- DELETE endpoints for any resource (Apollo does not expose these via public REST)

If Apollo adds these to their public API, they'll be added here.
