import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { z } from 'zod';
import type { CommandDefinition } from '../../src/core/types.js';

/**
 * Reimplementation of the same option-mapping logic from
 * src/commands/index.ts → registerCommand(). Kept in sync deliberately
 * so we can unit-test the negation handling without spinning up the
 * full CLI registry.
 */
function mapOptionsToInput(
  cmdDef: CommandDefinition,
  globalOpts: Record<string, any>,
): Record<string, any> {
  const input: Record<string, any> = {};

  for (const opt of cmdDef.cliMappings.options ?? []) {
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

  return input;
}

describe('--no-dedupe wiring', () => {
  it('Commander stores --no-dedupe under property "dedupe" (default true)', () => {
    const program = new Command();
    program.option('--no-dedupe');
    program.parse([], { from: 'user' });
    expect(program.opts().dedupe).toBe(true);
  });

  it('Commander sets dedupe=false when --no-dedupe is passed', () => {
    const program = new Command();
    program.option('--no-dedupe');
    program.parse(['--no-dedupe'], { from: 'user' });
    expect(program.opts().dedupe).toBe(false);
  });

  it('mapOptionsToInput maps --no-dedupe (Commander "dedupe") to run_dedupe field', () => {
    const cmdDef: CommandDefinition = {
      name: 'contacts_create',
      group: 'contacts',
      subcommand: 'create',
      description: 'test',
      inputSchema: z.object({ run_dedupe: z.boolean().default(true) }),
      cliMappings: {
        options: [{ field: 'run_dedupe', flags: '--no-dedupe' }],
      },
      endpoint: { method: 'POST', path: '/contacts' },
      handler: async () => ({}),
    };

    const inputDefault = mapOptionsToInput(cmdDef, { dedupe: true });
    expect(inputDefault.run_dedupe).toBe(true);

    const inputNegated = mapOptionsToInput(cmdDef, { dedupe: false });
    expect(inputNegated.run_dedupe).toBe(false);
  });

  it('mapOptionsToInput continues to map normal --foo flags correctly', () => {
    const cmdDef: CommandDefinition = {
      name: 'contacts_create',
      group: 'contacts',
      subcommand: 'create',
      description: 'test',
      inputSchema: z.object({
        first_name: z.string(),
        last_name: z.string(),
      }),
      cliMappings: {
        options: [
          { field: 'first_name', flags: '--first-name <name>' },
          { field: 'last_name', flags: '--last-name <name>' },
        ],
      },
      endpoint: { method: 'POST', path: '/contacts' },
      handler: async () => ({}),
    };

    const input = mapOptionsToInput(cmdDef, { firstName: 'John', lastName: 'Smith' });
    expect(input).toEqual({ first_name: 'John', last_name: 'Smith' });
  });

  it('mapOptionsToInput skips options the user did not pass', () => {
    const cmdDef: CommandDefinition = {
      name: 'contacts_create',
      group: 'contacts',
      subcommand: 'create',
      description: 'test',
      inputSchema: z.object({
        first_name: z.string().optional(),
        title: z.string().optional(),
      }),
      cliMappings: {
        options: [
          { field: 'first_name', flags: '--first-name <name>' },
          { field: 'title', flags: '--title <title>' },
        ],
      },
      endpoint: { method: 'POST', path: '/contacts' },
      handler: async () => ({}),
    };

    const input = mapOptionsToInput(cmdDef, { firstName: 'John' });
    expect(input).toEqual({ first_name: 'John' });
    expect(input).not.toHaveProperty('title');
  });
});
