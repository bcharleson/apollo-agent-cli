import { Command } from 'commander';
import type { CommandDefinition, GlobalOptions } from '../core/types.js';
import { resolveApiKey } from '../core/auth.js';
import { ApolloClient } from '../core/client.js';
import { output, outputError } from '../core/output.js';

// Auth commands (special — don't need an API client)
import { registerLoginCommand } from './auth/login.js';
import { registerLogoutCommand } from './auth/logout.js';

// MCP command
import { registerMcpCommand } from './mcp/index.js';

// People
import { peopleSearchCommand } from './people/search.js';
import { peopleEnrichCommand } from './people/enrich.js';
import { peopleBulkEnrichCommand } from './people/bulk-enrich.js';

// Contacts
import { contactsSearchCommand } from './contacts/search.js';
import { contactsCreateCommand } from './contacts/create.js';
import { contactsUpdateCommand } from './contacts/update.js';
import { contactsUpdateStagesCommand } from './contacts/update-stages.js';
import { contactsGetCommand } from './contacts/get.js';
import { contactsStagesCommand } from './contacts/stages.js';
import { contactsBulkUpdateCommand } from './contacts/bulk-update.js';
import { contactsUpdateLabelsCommand } from './contacts/update-labels.js';

// Accounts
import { accountsSearchCommand } from './accounts/search.js';
import { accountsCreateCommand } from './accounts/create.js';
import { accountsUpdateCommand } from './accounts/update.js';
import { accountsBulkCreateCommand } from './accounts/bulk-create.js';
import { accountsGetCommand } from './accounts/get.js';
import { accountsStagesCommand } from './accounts/stages.js';
import { accountsBulkUpdateCommand } from './accounts/bulk-update.js';
import { accountsUpdateLabelsCommand } from './accounts/update-labels.js';

// Organizations
import { organizationsEnrichCommand } from './organizations/enrich.js';
import { organizationsBulkEnrichCommand } from './organizations/bulk-enrich.js';
import { organizationsGetCommand } from './organizations/get.js';
import { organizationsJobPostingsCommand } from './organizations/job-postings.js';
import { organizationsSearchCommand } from './organizations/search.js';
import { organizationsNewsCommand } from './organizations/news.js';
import { organizationsPostalAddressesCommand } from './organizations/postal-addresses.js';

// Sequences
import { sequencesSearchCommand } from './sequences/search.js';
import { sequencesAddContactsCommand } from './sequences/add-contacts.js';
import { sequencesActivateCommand } from './sequences/activate.js';
import { sequencesRemoveContactsCommand } from './sequences/remove-contacts.js';
import { sequencesGetCommand } from './sequences/get.js';
import { sequencesDeactivateCommand } from './sequences/deactivate.js';
import { sequencesArchiveCommand } from './sequences/archive.js';
import { sequencesStepsListCommand } from './sequences/steps-list.js';

// Emails
import { emailsSearchCommand } from './emails/search.js';
import { emailsActivitiesCommand } from './emails/activities.js';

// Deals
import { dealsCreateCommand } from './deals/create.js';
import { dealsUpdateCommand } from './deals/update.js';
import { dealsListCommand } from './deals/list.js';
import { dealsGetCommand } from './deals/get.js';
import { dealsStagesCommand } from './deals/stages.js';

// Tasks
import { tasksSearchCommand } from './tasks/search.js';
import { tasksCreateCommand } from './tasks/create.js';
import { tasksGetCommand } from './tasks/get.js';
import { tasksUpdateCommand } from './tasks/update.js';

// Calls
import { callsSearchCommand } from './calls/search.js';
import { callsCreateCommand } from './calls/create.js';

// Users
import { usersListCommand } from './users/list.js';

// Email Accounts
import { emailAccountsListCommand } from './email-accounts/list.js';
import { emailAccountsGetCommand } from './email-accounts/get.js';

// Custom Fields
import { customFieldsListCommand } from './custom-fields/list.js';

// Labels
import { labelsListCommand } from './labels/list.js';

// Lists
import { listsListCommand } from './lists/list.js';

// Analytics
import { analyticsReportCommand } from './analytics/report.js';

// Usage Stats
import { usageStatsApiCommand } from './usage-stats/api.js';

/** All command definitions — the single source of truth for CLI + MCP */
export const allCommands: CommandDefinition[] = [
  // People
  peopleSearchCommand,
  peopleEnrichCommand,
  peopleBulkEnrichCommand,
  // Contacts
  contactsSearchCommand,
  contactsGetCommand,
  contactsCreateCommand,
  contactsUpdateCommand,
  contactsBulkUpdateCommand,
  contactsUpdateStagesCommand,
  contactsUpdateLabelsCommand,
  contactsStagesCommand,
  // Accounts
  accountsSearchCommand,
  accountsGetCommand,
  accountsCreateCommand,
  accountsUpdateCommand,
  accountsBulkCreateCommand,
  accountsBulkUpdateCommand,
  accountsUpdateLabelsCommand,
  accountsStagesCommand,
  // Organizations
  organizationsSearchCommand,
  organizationsEnrichCommand,
  organizationsBulkEnrichCommand,
  organizationsGetCommand,
  organizationsJobPostingsCommand,
  organizationsNewsCommand,
  organizationsPostalAddressesCommand,
  // Sequences
  sequencesSearchCommand,
  sequencesGetCommand,
  sequencesAddContactsCommand,
  sequencesRemoveContactsCommand,
  sequencesActivateCommand,
  sequencesDeactivateCommand,
  sequencesArchiveCommand,
  sequencesStepsListCommand,
  // Emails
  emailsSearchCommand,
  emailsActivitiesCommand,
  // Deals
  dealsListCommand,
  dealsGetCommand,
  dealsCreateCommand,
  dealsUpdateCommand,
  dealsStagesCommand,
  // Tasks
  tasksSearchCommand,
  tasksGetCommand,
  tasksCreateCommand,
  tasksUpdateCommand,
  // Calls
  callsSearchCommand,
  callsCreateCommand,
  // Users
  usersListCommand,
  // Email Accounts
  emailAccountsListCommand,
  emailAccountsGetCommand,
  // Custom Fields
  customFieldsListCommand,
  // Labels
  labelsListCommand,
  // Lists
  listsListCommand,
  // Analytics
  analyticsReportCommand,
  // Usage Stats
  usageStatsApiCommand,
];

export function registerAllCommands(program: Command): void {
  // Register auth commands (special handling — no API client needed)
  registerLoginCommand(program);
  registerLogoutCommand(program);

  // Register MCP server command
  registerMcpCommand(program);

  // Group commands by their `group` field
  const groups = new Map<string, CommandDefinition[]>();
  for (const cmd of allCommands) {
    if (!groups.has(cmd.group)) groups.set(cmd.group, []);
    groups.get(cmd.group)!.push(cmd);
  }

  for (const [groupName, commands] of groups) {
    const groupCmd = program
      .command(groupName)
      .description(`Manage ${groupName}`);

    for (const cmdDef of commands) {
      registerCommand(groupCmd, cmdDef);
    }

    // Show available subcommands when an unknown one is used
    groupCmd.on('command:*', (operands: string[]) => {
      const available = commands.map((c) => c.subcommand).join(', ');
      console.error(`error: unknown command '${operands[0]}' for '${groupName}'`);
      console.error(`Available commands: ${available}`);
      process.exitCode = 1;
    });
  }
}

function registerCommand(parent: Command, cmdDef: CommandDefinition): void {
  const cmd = parent
    .command(cmdDef.subcommand)
    .description(cmdDef.description);

  // Register positional arguments
  if (cmdDef.cliMappings.args) {
    for (const arg of cmdDef.cliMappings.args) {
      const argStr = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
      cmd.argument(argStr, `${arg.field}`);
    }
  }

  // Register options
  if (cmdDef.cliMappings.options) {
    for (const opt of cmdDef.cliMappings.options) {
      cmd.option(opt.flags, opt.description ?? '');
    }
  }

  // Add examples to help
  if (cmdDef.examples?.length) {
    cmd.addHelpText('after', '\nExamples:\n' + cmdDef.examples.map((e) => `  $ ${e}`).join('\n'));
  }

  cmd.action(async (...actionArgs: any[]) => {
    try {
      // Collect global options from the root program
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions & Record<string, any>;

      // --pretty shorthand for --output pretty
      if (globalOpts.pretty) {
        globalOpts.output = 'pretty';
      }

      // Resolve API key
      const apiKey = await resolveApiKey(globalOpts.apiKey);
      const client = new ApolloClient({ apiKey });

      // Build input from positional args + options
      const input: Record<string, any> = {};

      // Map positional arguments
      if (cmdDef.cliMappings.args) {
        for (let i = 0; i < cmdDef.cliMappings.args.length; i++) {
          const argDef = cmdDef.cliMappings.args[i];
          if (actionArgs[i] !== undefined) {
            input[argDef.field] = actionArgs[i];
          }
        }
      }

      // Map options. Commander stores option values under camelCase property
      // names derived from the long flag. For negated booleans (`--no-foo`)
      // Commander stores the value under `foo` (default `true`, `false` when
      // `--no-foo` is passed) — we strip the `no-` prefix before camelCasing.
      if (cmdDef.cliMappings.options) {
        for (const opt of cmdDef.cliMappings.options) {
          const longFlagMatch = opt.flags.match(/--([a-z][a-z0-9-]*)/);
          if (!longFlagMatch) continue;
          let longFlag = longFlagMatch[1];
          if (longFlag.startsWith('no-')) {
            longFlag = longFlag.slice(3);
          }
          const optName = longFlag.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          if (globalOpts[optName] !== undefined) {
            input[opt.field] = globalOpts[optName];
          }
        }
      }

      // Validate input against schema
      const parsed = cmdDef.inputSchema.safeParse(input);
      if (!parsed.success) {
        const issues = parsed.error.issues ?? [];
        const missing = issues
          .filter((i: any) => i.code === 'invalid_type' && String(i.message).includes('received undefined'))
          .map((i: any) => '--' + String(i.path?.[0] ?? '').replace(/_/g, '-'));
        if (missing.length > 0) {
          throw new Error(`Missing required option(s): ${missing.join(', ')}`);
        }
        const msg = issues.map((i: any) => `${i.path?.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Invalid input: ${msg}`);
      }

      const result = await cmdDef.handler(parsed.data, client);
      output(result, globalOpts);
    } catch (error) {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions;
      outputError(error, globalOpts);
    }
  });
}
