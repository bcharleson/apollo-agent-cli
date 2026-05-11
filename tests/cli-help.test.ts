import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { allCommands } from '../src/commands/index.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const tsxBin = path.join(projectRoot, 'node_modules/.bin/tsx');
const cliEntry = path.join(projectRoot, 'src/index.ts');

interface CliResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

function runCli(args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(tsxBin, [cliEntry, ...args], {
      cwd: projectRoot,
      env: { ...process.env, APOLLO_API_KEY: '' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ exitCode: code, stdout, stderr }));
  });
}

const groups = Array.from(new Set(allCommands.map((c) => c.group)));

describe('CLI --help (no API key)', () => {
  it('prints top-level help with all groups', async () => {
    const r = await runCli(['--help']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('apollo');
    for (const g of groups) {
      expect(r.stdout, `missing group: ${g}`).toContain(g);
    }
  });

  it('prints version', async () => {
    const r = await runCli(['--version']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  it('prints help for every group', async () => {
    for (const g of groups) {
      const r = await runCli([g, '--help']);
      expect(r.exitCode, `${g} --help failed: ${r.stderr}`).toBe(0);
      expect(r.stdout).toContain(g);
    }
  }, 30_000);

  it('prints help for every subcommand without making API calls', async () => {
    for (const cmd of allCommands) {
      const r = await runCli([cmd.group, cmd.subcommand, '--help']);
      expect(
        r.exitCode,
        `${cmd.group} ${cmd.subcommand} --help failed: ${r.stderr}`,
      ).toBe(0);
      expect(r.stdout.toLowerCase()).toContain(cmd.subcommand.toLowerCase());
    }
  }, 60_000);

  it('exits non-zero on unknown group', async () => {
    const r = await runCli(['nonexistent-group']);
    expect(r.exitCode).not.toBe(0);
  });
});
