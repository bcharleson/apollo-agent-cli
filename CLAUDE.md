# Claude Code Instructions — Apollo CLI

## Project Overview

This is the official CLI and MCP server for [Apollo.io](https://apollo.io). It wraps Apollo's full documented REST API (55 commands across 16 groups) into both a terminal CLI and an MCP server for AI assistants.

**Dual interface, single codebase:** Every API endpoint is defined once as a `CommandDefinition` object that powers both the CLI subcommand and the MCP tool.

## Architecture

### CommandDefinition Pattern

Every API endpoint lives in one file under `src/commands/<group>/<subcommand>.ts` and exports a single `CommandDefinition` object:

```typescript
interface CommandDefinition {
  name: string;           // MCP tool name: "contacts_search"
  group: string;          // CLI group: "contacts"
  subcommand: string;     // CLI subcommand: "search"
  description: string;    // Shared help text
  inputSchema: ZodObject; // Validates CLI flags AND MCP input
  cliMappings: {...};     // Maps Zod fields to Commander args/options
  endpoint: { method, path };
  fieldMappings: {...};   // Where each field goes: path | query | body
  handler: (input, client) => Promise<unknown>;
}
```

**Adding a new endpoint = creating one file + adding it to `allCommands` in `src/commands/index.ts`.**

### Key Files

- `src/core/types.ts` — CommandDefinition interface and shared types
- `src/core/client.ts` — HTTP client (x-api-key auth, retry, pagination, master-key detection)
- `src/core/handler.ts` — executeCommand() builds HTTP requests from CommandDefinition + input
- `src/core/auth.ts` — API key resolution (--api-key flag > APOLLO_API_KEY env > config file)
- `src/core/output.ts` — JSON output formatting, --fields, --quiet, --pretty
- `src/core/errors.ts` — Typed error classes (including MasterKeyError)
- `src/core/config.ts` — ~/.apollo-cli/config.json manager
- `src/commands/index.ts` — Command registry, auto-registration, input validation
- `src/mcp/server.ts` — MCP server (registers all CommandDefinitions as tools)
- `src/index.ts` — CLI entry point
- `src/mcp.ts` — Direct MCP entry point

### Directory Structure

```
src/
├── index.ts                 # CLI entry
├── mcp.ts                   # MCP entry
├── core/                    # Shared infrastructure
│   ├── types.ts             # CommandDefinition + GlobalOptions
│   ├── client.ts            # x-api-key HTTP client + isMasterKeyEndpoint()
│   ├── handler.ts           # executeCommand() generic request builder
│   ├── auth.ts              # API key resolution
│   ├── config.ts            # ~/.apollo-cli/config.json manager
│   ├── output.ts            # JSON / pretty / table formatters
│   └── errors.ts            # Typed errors incl. MasterKeyError
├── commands/
│   ├── index.ts             # Registry + registerAllCommands()
│   ├── auth/                # login, logout
│   ├── mcp/                 # mcp server command
│   ├── people/              # search, enrich, bulk-enrich (3)
│   ├── contacts/            # search, get, create, update, bulk-update,
│   │                          update-stages, update-labels, stages (8)
│   ├── accounts/            # search, get, create, update, bulk-create,
│   │                          bulk-update, update-labels, stages (8)
│   ├── organizations/       # search, enrich, bulk-enrich, get, job-postings,
│   │                          news, postal-addresses (7)
│   ├── sequences/           # search, get, add-contacts, remove-contacts,
│   │                          activate, deactivate, archive, steps-list (8)
│   ├── emails/              # search, activities (2)
│   ├── deals/               # list, get, create, update, stages (5)
│   ├── tasks/               # search, get, create, update (4)
│   ├── calls/               # search, create (2)
│   ├── users/               # list (1)
│   ├── email-accounts/      # list, get (2)
│   ├── custom-fields/       # list (1)
│   ├── labels/              # list (1)
│   ├── lists/               # list (1)
│   ├── analytics/           # report (1)
│   └── usage-stats/         # api (1)
└── mcp/
    └── server.ts
```

**Total: 55 commands across 16 groups** (full documented Apollo REST API coverage).

## Tech Stack

- **TypeScript** (ESM, strict mode)
- **Node.js 18+** (target node18 in tsup)
- **Commander.js** — CLI framework
- **Zod v4** — Input validation (shared between CLI and MCP)
- **@modelcontextprotocol/sdk** — MCP server
- **@inquirer/prompts** — Interactive prompts (login only, dynamically imported)
- **tsup** — Bundler (two entry points: index.ts, mcp.ts)
- **vitest** — Testing

## Development Commands

```bash
npm install
npm run build      # Build with tsup → dist/
npm run dev        # Run CLI with tsx (no build needed)
npm test           # Run vitest
npm run typecheck  # TypeScript type checking
```

## API Quirks

- **Auth:** `x-api-key` header (NOT Bearer token — this is different from Instantly/HubSpot)
- **Base URL:** `https://api.apollo.io/api/v1`
- **Config dir:** `~/.apollo-cli/config.json`
- **Env var:** `APOLLO_API_KEY`
- **Pagination:** Page-number based (`page` + `per_page`), NOT cursor-based
- **Sequences API path:** `emailer_campaigns` (NOT `sequences`) — CLI aliases to `sequences`
- **Deals API path:** `opportunities` (NOT `deals`) — CLI aliases to `deals`
- **Companies API path:** `mixed_companies` for search, `organizations` for enrichment
- **Master key:** ~half the endpoints require a master key. Detection lives in `src/core/client.ts` as `MASTER_KEY_PATTERNS` — explicit `(method, regex)` tuples (NOT prefix matching, which used to false-positive `/accounts/search`). On 403, the client checks the tuple list and raises `MasterKeyError` if matched.
- **People search vs enrichment:** Search (`/mixed_people/api_search`) returns profiles only, no credits. Enrichment (`/people/match`) returns emails/phones, consumes credits.
- **Modern People filter names:** `q_organization_domains_list` (NOT the legacy `q_organization_domains`). `person_titles[]`, `person_seniorities[]`, `contact_email_status[]` all expect arrays.
- **Multi-value filters:** Many Apollo POST endpoints expect arrays. Custom handlers split comma-separated CLI strings into arrays before sending.
- **Negated boolean flags:** Commander stores `--no-foo` under property `foo` (default true, false when passed). The flag → field mapping in `src/commands/index.ts` strips the `no-` prefix before camelCasing.

## Adding New Commands

1. Create `src/commands/<group>/<subcommand>.ts`
2. Export a `CommandDefinition` object following existing patterns
3. Import and add it to the `allCommands` array in `src/commands/index.ts`
4. Build and test: `npm run build && npm test`

Use `executeCommand()` from `src/core/handler.ts` as the handler for standard CRUD endpoints. Write custom handlers when the API requires array transformation (splitting comma-separated strings) or conditional logic.

## Important Conventions

- **@inquirer/prompts is external** — marked as external in tsup.config.ts, dynamically imported only in login.ts
- **Zod validation runs before API calls** — gives clear "Missing required option(s)" errors
- **All output is JSON to stdout** — never console.log except structured output
- **Apollo errors** — client checks for `message`, `error`, and `messages[]` in error bodies
- **MasterKeyError** — raised automatically when a 403 is returned on a known master-key endpoint
- **No dedup by default OFF** — contacts create defaults `run_dedupe: true` (safe default)

## Do Not

- Do not change auth to Bearer — Apollo uses `x-api-key` header
- Do not use cursor pagination — Apollo uses page numbers
- Do not add static imports of `@inquirer/prompts`
- Do not modify output format — agents depend on JSON to stdout
- Do not create new files without adding them to `allCommands` in `src/commands/index.ts`
