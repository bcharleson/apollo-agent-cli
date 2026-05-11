import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, statSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveApiKey } from '../../src/core/auth.js';
import { loadConfig, saveConfig, deleteConfig, getConfigPath, getConfigDir } from '../../src/core/config.js';
import { AuthError } from '../../src/core/errors.js';

let tmpHome: string;
const originalEnv = { ...process.env };

beforeAll(() => {
  tmpHome = mkdtempSync(join(tmpdir(), 'apollo-agent-cli-test-'));
});

afterAll(() => {
  rmSync(tmpHome, { recursive: true, force: true });
});

beforeEach(() => {
  process.env.APOLLO_CLI_CONFIG_DIR = tmpHome;
  delete process.env.APOLLO_API_KEY;
});

afterEach(async () => {
  await deleteConfig().catch(() => {});
  process.env = { ...originalEnv };
  process.env.APOLLO_CLI_CONFIG_DIR = tmpHome;
});

describe('config.ts', () => {
  it('getConfigDir() honors APOLLO_CLI_CONFIG_DIR override', () => {
    expect(getConfigDir()).toBe(tmpHome);
  });

  it('getConfigPath() returns <config-dir>/config.json', () => {
    expect(getConfigPath()).toBe(join(tmpHome, 'config.json'));
  });

  it('loadConfig() returns null when no config file exists', async () => {
    const result = await loadConfig();
    expect(result).toBeNull();
  });

  it('loadConfig() returns null on malformed JSON (no throw)', async () => {
    writeFileSync(join(tmpHome, 'config.json'), '{not json}');
    const result = await loadConfig();
    expect(result).toBeNull();
  });

  it('saveConfig() writes JSON to disk', async () => {
    await saveConfig({ api_key: 'test-key-123' });
    expect(existsSync(getConfigPath())).toBe(true);
    const loaded = await loadConfig();
    expect(loaded).toEqual({ api_key: 'test-key-123' });
  });

  it('saveConfig() writes file with 0600 permissions', async () => {
    await saveConfig({ api_key: 'secret' });
    const stat = statSync(getConfigPath());
    // Last 3 octal digits should be 600 (owner read/write only)
    expect((stat.mode & 0o777).toString(8)).toBe('600');
  });

  it('saveConfig() creates the directory if missing', async () => {
    process.env.APOLLO_CLI_CONFIG_DIR = join(tmpHome, 'nested-dir');
    await saveConfig({ api_key: 'k' });
    expect(existsSync(getConfigPath())).toBe(true);
  });

  it('saveConfig() overwrites existing config', async () => {
    await saveConfig({ api_key: 'first' });
    await saveConfig({ api_key: 'second' });
    const loaded = await loadConfig();
    expect(loaded?.api_key).toBe('second');
  });

  it('deleteConfig() removes the file when present', async () => {
    await saveConfig({ api_key: 'k' });
    expect(existsSync(getConfigPath())).toBe(true);
    await deleteConfig();
    expect(existsSync(getConfigPath())).toBe(false);
  });

  it('deleteConfig() does NOT throw when file is missing', async () => {
    await expect(deleteConfig()).resolves.toBeUndefined();
  });

  it('loadConfig() returns null when file is unreadable', async () => {
    writeFileSync(join(tmpHome, 'config.json'), 'x');
    chmodSync(join(tmpHome, 'config.json'), 0o000);
    try {
      const result = await loadConfig();
      expect(result).toBeNull();
    } finally {
      chmodSync(join(tmpHome, 'config.json'), 0o600);
    }
  });
});

describe('resolveApiKey()', () => {
  it('returns the --api-key flag when provided (highest priority)', async () => {
    process.env.APOLLO_API_KEY = 'env-key';
    await saveConfig({ api_key: 'config-key' });

    const result = await resolveApiKey('flag-key');
    expect(result).toBe('flag-key');
  });

  it('returns APOLLO_API_KEY env var when no flag is provided', async () => {
    process.env.APOLLO_API_KEY = 'env-key';
    await saveConfig({ api_key: 'config-key' });

    const result = await resolveApiKey();
    expect(result).toBe('env-key');
  });

  it('returns stored config when no flag or env var', async () => {
    await saveConfig({ api_key: 'config-key' });

    const result = await resolveApiKey();
    expect(result).toBe('config-key');
  });

  it('throws AuthError with actionable message when no key is found', async () => {
    const err = await resolveApiKey().catch((e) => e);
    expect(err).toBeInstanceOf(AuthError);
    expect(err.message).toContain('APOLLO_API_KEY');
    expect(err.message).toContain('apollo login');
    expect(err.message).toContain('--api-key');
  });

  it('does NOT throw when env var is set but config is missing', async () => {
    process.env.APOLLO_API_KEY = 'env-only';
    const result = await resolveApiKey();
    expect(result).toBe('env-only');
  });

  it('does NOT use env var when explicit empty flag is passed (flag wins only if truthy)', async () => {
    process.env.APOLLO_API_KEY = 'env-key';
    const result = await resolveApiKey('');
    expect(result).toBe('env-key');
  });

  it('treats malformed config as missing (does not crash)', async () => {
    writeFileSync(join(tmpHome, 'config.json'), 'corrupt');
    const err = await resolveApiKey().catch((e) => e);
    expect(err).toBeInstanceOf(AuthError);
  });
});
