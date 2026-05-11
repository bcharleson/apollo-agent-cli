import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { allCommands } from '../../src/commands/index.js';

describe('command registry', () => {
  it('has at least 29 commands', () => {
    expect(allCommands.length).toBeGreaterThanOrEqual(29);
  });

  it('has unique MCP tool names', () => {
    const names = allCommands.map((c) => c.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes).toEqual([]);
  });

  it('uses snake_case <group>_<subcommand> for MCP tool names', () => {
    for (const cmd of allCommands) {
      expect(cmd.name, `${cmd.group} ${cmd.subcommand}`).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it.each(['name', 'group', 'subcommand', 'description'] as const)(
    'every command has a non-empty %s',
    (field) => {
      for (const cmd of allCommands) {
        expect(cmd[field], `${cmd.name}.${field}`).toBeTruthy();
      }
    },
  );

  it('every command has a valid HTTP method', () => {
    const allowed = new Set(['GET', 'POST', 'PATCH', 'DELETE']);
    for (const cmd of allCommands) {
      expect(allowed.has(cmd.endpoint.method), `${cmd.name} has invalid method`).toBe(true);
    }
  });

  it('every command has an endpoint path starting with /', () => {
    for (const cmd of allCommands) {
      expect(cmd.endpoint.path.startsWith('/'), `${cmd.name} path: ${cmd.endpoint.path}`).toBe(
        true,
      );
    }
  });

  it('every command has a Zod schema', () => {
    for (const cmd of allCommands) {
      expect(cmd.inputSchema instanceof z.ZodObject, `${cmd.name} schema`).toBe(true);
    }
  });

  it('every command has a handler function', () => {
    for (const cmd of allCommands) {
      expect(typeof cmd.handler, `${cmd.name} handler`).toBe('function');
    }
  });

  it('command name == group_subcommand (with - swapped for _ in both)', () => {
    for (const cmd of allCommands) {
      const expected = `${cmd.group.replace(/-/g, '_')}_${cmd.subcommand.replace(/-/g, '_')}`;
      expect(cmd.name, `expected ${expected}`).toBe(expected);
    }
  });

  it('every commander argument referenced in cliMappings.args exists in the schema shape', () => {
    for (const cmd of allCommands) {
      const shape = (cmd.inputSchema as z.ZodObject<any>).shape;
      for (const arg of cmd.cliMappings.args ?? []) {
        expect(arg.field in shape, `${cmd.name}: arg.field "${arg.field}" not in schema`).toBe(
          true,
        );
      }
    }
  });

  it('every commander option field exists in the schema shape', () => {
    for (const cmd of allCommands) {
      const shape = (cmd.inputSchema as z.ZodObject<any>).shape;
      for (const opt of cmd.cliMappings.options ?? []) {
        expect(opt.field in shape, `${cmd.name}: option.field "${opt.field}" not in schema`).toBe(
          true,
        );
      }
    }
  });

  it('fieldMappings keys (when present) all exist in the schema', () => {
    for (const cmd of allCommands) {
      if (!cmd.fieldMappings) continue;
      const shape = (cmd.inputSchema as z.ZodObject<any>).shape;
      for (const key of Object.keys(cmd.fieldMappings)) {
        expect(key in shape, `${cmd.name}: fieldMappings key "${key}" not in schema`).toBe(true);
      }
    }
  });

  it('expected core commands are registered', () => {
    const names = new Set(allCommands.map((c) => c.name));
    const expected = [
      'people_search',
      'people_enrich',
      'contacts_search',
      'contacts_create',
      'contacts_update',
      'accounts_search',
      'accounts_create',
      'organizations_enrich',
      'sequences_search',
      'deals_create',
      'tasks_search',
      'calls_search',
      'users_list',
      'email_accounts_list',
    ];
    for (const e of expected) {
      expect(names.has(e), `missing ${e}`).toBe(true);
    }
  });
});
