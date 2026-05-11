# Apollo CLI — QC Review Brief

This file contains everything a QC agent needs to audit this project from a fresh context window.
Copy the **SYSTEM MESSAGE** and **USER MESSAGE** below directly into a new conversation.

---

## What Was Built

A dual-purpose **CLI + MCP server** for Apollo.io (`apollo-agent-cli` on npm), built from scratch
following the established conventions of the existing CLI tool fleet in `~/Developer/`.

### Project Location
`~/Developer/apollo-cli-INREVIEW/`

### Stats
- **55 commands across 16 groups** — full coverage of Apollo's documented REST API
- **0 TypeScript errors** (`npm run typecheck` passes clean)
- **95 unit tests passing** (vitest, no API key required)
- **Build output:** `dist/index.js` + `dist/mcp.js`

### Command Groups & Commands

| Group | Commands | Count |
|-------|----------|-------|
| `people` | `search`, `enrich`, `bulk-enrich` | 3 |
| `contacts` | `search`, `get`, `create`, `update`, `bulk-update`, `update-stages`, `update-labels`, `stages` | 8 |
| `accounts` | `search`, `get`, `create`, `update`, `bulk-create`, `bulk-update`, `update-labels`, `stages` | 8 |
| `organizations` | `search`, `enrich`, `bulk-enrich`, `get`, `job-postings`, `news`, `postal-addresses` | 7 |
| `sequences` | `search`, `get`, `add-contacts`, `remove-contacts`, `activate`, `deactivate`, `archive`, `steps-list` | 8 |
| `emails` | `search`, `activities` | 2 |
| `deals` | `list`, `get`, `create`, `update`, `stages` | 5 |
| `tasks` | `search`, `get`, `create`, `update` | 4 |
| `calls` | `search`, `create` | 2 |
| `users` | `list` | 1 |
| `email-accounts` | `list`, `get` | 2 |
| `custom-fields` | `list` | 1 |
| `labels` | `list` | 1 |
| `lists` | `list` | 1 |
| `analytics` | `report` | 1 |
| `usage-stats` | `api` | 1 |

### File Structure

```
apollo-cli-INREVIEW/
├── package.json              # name: apollo-agent-cli, version: 0.1.0
├── tsconfig.json             # ES2022, ESM, strict, bundler resolution
├── tsup.config.ts            # Two entry points: index.ts + mcp.ts
├── vitest.config.ts          # Test config (95 tests pass, no API key)
├── README.md                 # Public-facing documentation
├── AGENTS.md                 # Agent reference (commands, workflows, MCP config)
├── CLAUDE.md                 # Dev instructions for Claude Code
├── REVIEW.md                 # This file
├── tests/
│   ├── cli-help.test.ts      # spawns CLI, asserts --help works for every command
│   └── unit/
│       ├── client.test.ts                # 401/403/404/422/429/5xx + master-key + timeout
│       ├── master-key-detection.test.ts  # exact (method, path) matcher
│       ├── registry.test.ts              # validates allCommands shape
│       ├── output.test.ts                # JSON / pretty / table formatters
│       ├── array-transforms.test.ts      # comma-CSV → array splitting
│       ├── no-dedupe.test.ts             # Commander negation flag wiring
│       └── mcp-validation.test.ts        # Zod safeParse before handler
└── src/
    ├── index.ts              # CLI entry (apollo <group> <subcommand>)
    ├── mcp.ts                # MCP entry (node dist/mcp.js)
    ├── core/
    │   ├── types.ts          # CommandDefinition interface (fieldMappings now optional)
    │   ├── client.ts         # ApolloClient + isMasterKeyEndpoint() + MASTER_KEY_PATTERNS
    │   ├── config.ts         # ~/.apollo-cli/config.json manager
    │   ├── auth.ts           # Key resolution: --api-key > APOLLO_API_KEY > config file
    │   ├── errors.ts         # ApolloError, AuthError, MasterKeyError, RateLimitError, etc.
    │   ├── output.ts         # JSON / pretty / table formatters, --fields filter
    │   └── handler.ts        # executeCommand() — routes fields to path/query/body
    ├── commands/
    │   ├── index.ts          # allCommands[] registry + registerAllCommands()
    │   ├── auth/             # login.ts, logout.ts
    │   ├── mcp/              # index.ts (starts MCP server)
    │   ├── people/           # search.ts, enrich.ts, bulk-enrich.ts (3)
    │   ├── contacts/         # search, get, create, update, bulk-update, stages,
    │   │                       update-stages, update-labels (8)
    │   ├── accounts/         # search, get, create, update, bulk-create, bulk-update,
    │   │                       update-labels, stages (8)
    │   ├── organizations/    # search, enrich, bulk-enrich, get, job-postings,
    │   │                       news, postal-addresses (7)
    │   ├── sequences/        # search, get, add-contacts, remove-contacts, activate,
    │   │                       deactivate, archive, steps-list (8)
    │   ├── emails/           # search, activities (2)
    │   ├── deals/            # list, get, create, update, stages (5)
    │   ├── tasks/            # search, get, create, update (4)
    │   ├── calls/            # search, create (2)
    │   ├── users/            # list (1)
    │   ├── email-accounts/   # list, get (2)
    │   ├── custom-fields/    # list (1)
    │   ├── labels/           # list (1)
    │   ├── lists/            # list (1)
    │   ├── analytics/        # report (1)
    │   └── usage-stats/      # api (1)
    └── mcp/
        └── server.ts         # McpServer — registers all 55 commands as MCP tools
                              # with Zod safeParse validation before handler.
```

### Key Architecture Decisions

1. **Single `CommandDefinition` as source of truth** — every endpoint is one object that drives the CLI flags, Zod validation, HTTP request routing, AND MCP tool registration. No divergence.
2. **Apollo-specific auth:** `x-api-key` header — different from `Authorization: Bearer` used by Instantly/HubSpot in the same fleet.
3. **Page-number pagination** (`page` + `per_page`) — different from cursor-based `starting_after` used by Instantly.
4. **`MasterKeyError`** — custom error class raised automatically when a 403 is returned on known gated endpoints. Surfaces actionable instructions to the user.
5. **Array conversion in handlers** — Apollo's POST search endpoints require arrays. Custom handlers split comma-separated CLI strings into `string[]` before sending.
6. **API name aliases** — `emailer_campaigns` → `sequences` in CLI; `opportunities` → `deals` in CLI.
7. **Dedup safe default** — `contacts create` defaults `run_dedupe: true` to prevent duplicates.

### Reference CLIs Used as Patterns
Built by studying and matching conventions from:
- `~/Developer/instantly-cli/` (primary reference — 34 command groups, cursor pagination, Bearer auth)
- `~/Developer/hubspot-cli/` (bodyWrapper pattern)
- `~/Developer/smartlead-cli/` (query param auth, no pagination)

---

---

## SYSTEM MESSAGE
*(Copy this exactly as the system prompt for the QC agent)*

```
You are a senior TypeScript engineer and code quality auditor. Your job is to perform
a thorough quality control review of a newly built CLI tool codebase.

The project is a dual-purpose CLI + MCP server for Apollo.io, built to match the
conventions of an existing fleet of CLI tools. Your review should be methodical,
specific, and actionable.

You will:
1. Read every source file in the project
2. Compare the implementation against the stated architecture
3. Check for bugs, type errors, missing edge cases, and inconsistencies
4. Validate that the CLI and MCP server wire up correctly
5. Confirm conventions match the reference tools
6. Produce a structured review report

Be thorough. Do not skip files. Flag anything suspicious, broken, or inconsistent.
```

---

## USER MESSAGE
*(Copy this as the first user message for the QC agent)*

```
Please perform a full QC audit of the Apollo CLI project located at:

  ~/Developer/apollo-cli-INREVIEW/

## Context

This is a dual-purpose CLI and MCP server for Apollo.io built to match the conventions
of an existing CLI tool fleet. The primary reference tool to compare against is:

  ~/Developer/instantly-cli/

The project was built fresh in one session. Before reviewing, read CLAUDE.md in the
project root — it explains the architecture, conventions, and known quirks.

## What to Audit

### 1. Core Infrastructure (`src/core/`)
- `client.ts` — Does auth use `x-api-key` header (NOT Bearer)? Does retry/backoff logic work correctly? Is MasterKeyError raised properly on 403s for known endpoints?
- `errors.ts` — Are all error classes present and correct? Does MasterKeyError have useful instructions?
- `config.ts` — Is config stored at `~/.apollo-cli/config.json` with 0o600 permissions?
- `auth.ts` — Does key resolution follow: --api-key flag > APOLLO_API_KEY env > config file?
- `output.ts` — Does --fields correctly unwrap Apollo's response envelope keys (contacts, people, accounts, etc.)?
- `handler.ts` — Does executeCommand() correctly route path/query/body fields?
- `types.ts` — Is the CommandDefinition interface complete and correct?

### 2. Every Command File (`src/commands/`)
For each command file, verify:
- Does the `name` follow the pattern `<group>_<subcommand>` (used as MCP tool name)?
- Does the `endpoint.method` and `endpoint.path` match the real Apollo API?
- Are `fieldMappings` correct (path vs query vs body)?
- Does the Zod `inputSchema` match what the CLI flags accept?
- Does the `handler` call the right API path with the right body structure?
- Are required fields marked correctly?
- For search commands: are array-requiring fields split from comma-separated strings?
- For create commands with dedup: is `run_dedupe` defaulting correctly?

### 3. Command Registry (`src/commands/index.ts`)
- Are all 30 commands imported and present in `allCommands[]`?
- Does `registerAllCommands()` correctly group commands and register them with Commander?
- Is the `registerCommand()` function handling positional args AND options correctly?
- Does the input validation/error messaging work?

### 4. MCP Server (`src/mcp/server.ts`)
- Are all commands in `allCommands` registered as MCP tools?
- Is the tool name `cmdDef.name` used correctly?
- Does the error response format include `isError: true`?
- Is the stdio transport wired up correctly?

### 5. Auth Commands (`src/commands/auth/`)
- `login.ts` — Does it validate the key, save config, and output correctly in both TTY and non-TTY modes?
- `logout.ts` — Does it clean up the config file correctly?

### 6. Entry Points
- `src/index.ts` — Are global options (--api-key, --output, --pretty, --quiet, --fields) all present?
- `src/mcp.ts` — Does it wire up SIGINT/SIGTERM and start the MCP server?

### 7. Configuration Files
- `package.json` — Is `bin.apollo` pointing to `./dist/index.js`? Are all deps correct?
- `tsconfig.json` — Matches fleet standard (ES2022, ESM, bundler resolution, strict)?
- `tsup.config.ts` — Two entry points, ESM, node18, `@inquirer/prompts` external?

### 8. Apollo API Correctness
Cross-check these against the known Apollo API:
- Base URL: `https://api.apollo.io/api/v1` — is this used in `client.ts`?
- People search endpoint: `POST /mixed_people/api_search` (NOT `/mixed_people/search`, which is deprecated for API callers)
- People enrichment: `POST /people/match`
- Bulk people enrichment: `POST /people/bulk_match`
- Org enrichment: `GET /organizations/enrich`
- Sequences search: `POST /emailer_campaigns/search`
- Add to sequence: `POST /emailer_campaigns/{id}/add_contact_ids`
- Sequence activate: `POST /emailer_campaigns/{id}/approve`
- Remove from sequence: `POST /emailer_campaigns/remove_or_stop_contact_ids`
- Deals: `POST /opportunities` and `PATCH /opportunities/{id}`
- Tasks: `POST /tasks/search` and `POST /tasks`
- Calls: `GET /phone_calls/search` and `POST /phone_calls`
- Users: `GET /users/search`
- Email accounts: `GET /email_accounts`

### 9. Documentation
- `AGENTS.md` — Is it accurate, complete, and useful for an AI agent?
- `CLAUDE.md` — Does it accurately describe the architecture and conventions?

## Deliverable

Produce a structured review report with:

1. **PASS/FAIL summary** — overall verdict and critical issue count
2. **Critical bugs** — anything that would cause a runtime error or wrong API call
3. **API correctness issues** — wrong endpoints, wrong HTTP methods, wrong field locations
4. **Type/schema issues** — Zod schemas that don't match CLI flags or API expectations
5. **Convention violations** — anything that diverges from the instantly-cli pattern without good reason
6. **Minor issues** — cosmetic, style, non-blocking
7. **Missing functionality** — any obvious gaps vs the plan
8. **Recommended fixes** — specific file:line references with suggested changes

Be specific. Include file paths and line numbers where possible.
```
