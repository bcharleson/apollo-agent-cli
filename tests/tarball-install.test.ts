import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  rmSync,
  readdirSync,
  existsSync,
  statSync,
  readFileSync,
  realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

let installDir: string;
let tarballName: string;
let installedBin: string;
let installedMcp: string;

function run(cmd: string, args: string[], cwd: string): { status: number | null; out: string } {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf-8' });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed in ${cwd}\n${out}`);
  }
  return { status: r.status, out };
}

/**
 * End-to-end install verification. Catches misconfigured `files`/`bin`/shebang
 * /dependencies before they ship to npm. Mirrors `npm pack && npm install <tgz>`.
 *
 * Slow (~10–20s) — all assertions live in this file.
 */
beforeAll(() => {
  run('npm', ['pack', '--silent'], projectRoot);

  const candidate = readdirSync(projectRoot).find(
    (f) => f.startsWith('apollo-agent-cli-') && f.endsWith('.tgz'),
  );
  if (!candidate) throw new Error('npm pack did not produce a tarball');
  tarballName = candidate;

  installDir = mkdtempSync(join(tmpdir(), 'apollo-agent-cli-install-'));
  run('npm', ['init', '-y', '--silent'], installDir);
  run('npm', ['install', '--silent', join(projectRoot, tarballName)], installDir);

  installedBin = join(installDir, 'node_modules', '.bin', 'apollo');
  installedMcp = join(installDir, 'node_modules', 'apollo-agent-cli', 'dist', 'mcp.js');
}, 90_000);

afterAll(() => {
  if (installDir) rmSync(installDir, { recursive: true, force: true });
  if (tarballName) {
    const tarPath = join(projectRoot, tarballName);
    if (existsSync(tarPath)) rmSync(tarPath, { force: true });
  }
});

describe('tarball install', () => {
  it('produces a tarball whose name matches package.json', () => {
    const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    expect(tarballName).toBe(`${pkg.name}-${pkg.version}.tgz`);
  });

  it('installs the bin under node_modules/.bin/apollo', () => {
    expect(existsSync(installedBin)).toBe(true);
  });

  it('bin is executable (owner +x)', () => {
    const real = realpathSync(installedBin);
    const mode = statSync(real).mode;
    expect(mode & 0o100).toBeGreaterThan(0);
  });

  it('installed dist/index.js starts with #!/usr/bin/env node', () => {
    const indexFile = join(installDir, 'node_modules', 'apollo-agent-cli', 'dist', 'index.js');
    const first = readFileSync(indexFile, 'utf-8').split('\n')[0];
    expect(first).toBe('#!/usr/bin/env node');
  });

  it('installed dist/mcp.js exists and starts with shebang', () => {
    expect(existsSync(installedMcp)).toBe(true);
    const first = readFileSync(installedMcp, 'utf-8').split('\n')[0];
    expect(first).toBe('#!/usr/bin/env node');
  });

  it('apollo --version returns the package version', () => {
    const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
    const r = spawnSync(installedBin, ['--version'], { encoding: 'utf-8' });
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe(pkg.version);
  });

  it('apollo --help works and lists all 16 command groups', () => {
    const r = spawnSync(installedBin, ['--help'], { encoding: 'utf-8' });
    expect(r.status).toBe(0);
    for (const group of [
      'people',
      'contacts',
      'accounts',
      'organizations',
      'sequences',
      'emails',
      'deals',
      'tasks',
      'calls',
      'users',
      'email-accounts',
      'custom-fields',
      'labels',
      'lists',
      'analytics',
      'usage-stats',
    ]) {
      expect(r.stdout, `missing group: ${group}`).toContain(group);
    }
  });

  it('subcommand help works without an API key', () => {
    const r = spawnSync(installedBin, ['people', 'search', '--help'], {
      encoding: 'utf-8',
      env: { ...process.env, APOLLO_API_KEY: '' },
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('Apollo');
  });

  it('errors with actionable message when no key is set', () => {
    const r = spawnSync(installedBin, ['users', 'list'], {
      encoding: 'utf-8',
      env: {
        ...process.env,
        APOLLO_API_KEY: '',
        APOLLO_CLI_CONFIG_DIR: mkdtempSync(join(tmpdir(), 'apollo-empty-')),
      },
    });
    expect(r.status).toBe(1);
    const combined = (r.stderr + r.stdout).toLowerCase();
    expect(combined).toMatch(/api key|apollo login|apollo_api_key/);
  });

  it('npm package contains exactly the expected file set', () => {
    const installedPkg = join(installDir, 'node_modules', 'apollo-agent-cli');
    const files = readdirSync(installedPkg);
    expect(files).toContain('dist');
    expect(files).toContain('README.md');
    expect(files).toContain('AGENTS.md');
    expect(files).toContain('CLAUDE.md');
    expect(files).toContain('package.json');

    expect(files).not.toContain('src');
    expect(files).not.toContain('tests');
    expect(files).not.toContain('node_modules');
    expect(files).not.toContain('REVIEW.md');
    expect(files).not.toContain('KICKOFF.md');
  });
});
