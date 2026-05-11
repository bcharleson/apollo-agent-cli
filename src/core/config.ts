import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ApolloConfig } from './types.js';

/**
 * Resolve the config directory at call time (not module load time) so that
 * tests can override the location via APOLLO_CLI_CONFIG_DIR without needing
 * to re-import the module.
 */
export function getConfigDir(): string {
  return process.env.APOLLO_CLI_CONFIG_DIR ?? join(homedir(), '.apollo-cli');
}

export function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

export async function loadConfig(): Promise<ApolloConfig | null> {
  try {
    const content = await readFile(getConfigPath(), 'utf-8');
    return JSON.parse(content) as ApolloConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(config: ApolloConfig): Promise<void> {
  await mkdir(getConfigDir(), { recursive: true });
  await writeFile(getConfigPath(), JSON.stringify(config, null, 2) + '\n', {
    mode: 0o600,
  });
}

export async function deleteConfig(): Promise<void> {
  try {
    await rm(getConfigPath());
  } catch {
    // File doesn't exist, that's fine
  }
}
