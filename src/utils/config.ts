import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Config } from '../types/index.js';

const VIBELOG_DIR = '.vibelog';
const CONFIG_FILE = 'config.json';

export function getVibelogDir(): string {
  return join(process.cwd(), VIBELOG_DIR);
}

export function getConfigPath(): string {
  return join(getVibelogDir(), CONFIG_FILE);
}

export function getLogsDir(): string {
  return join(getVibelogDir(), 'logs');
}

export function getCheckpointsDir(): string {
  return join(getVibelogDir(), 'checkpoints');
}

export function isInitialized(): boolean {
  return existsSync(getConfigPath());
}

export function loadConfig(): Config {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    throw new Error('VibeLog not initialized. Run `vibe init` first.');
  }
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as Config;
}

export function saveConfig(config: Config): void {
  const dir = getVibelogDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

export function ensureDirectories(): void {
  const dirs = [getVibelogDir(), getLogsDir(), getCheckpointsDir()];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export const SENSITIVE_PATTERNS = [
  /sk_[a-zA-Z0-9_]{20,}/g,
  /pk_[a-zA-Z0-9_]{20,}/g,
  /[\w.-]+@[\w.-]+\.\w+/g,
  /0x[a-fA-F0-9]{64}/g,
  /ghp_[a-zA-Z0-9]{36}/g,
  /AIza[a-zA-Z0-9_-]{35}/g,
];

export function sanitizeSummary(text: string): { sanitized: string; hadSensitiveData: boolean } {
  let sanitized = text;
  let hadSensitiveData = false;
  for (const pattern of SENSITIVE_PATTERNS) {
    const newText = sanitized.replace(pattern, '[REDACTED]');
    if (newText !== sanitized) hadSensitiveData = true;
    sanitized = newText;
  }
  return { sanitized: sanitized.substring(0, 200), hadSensitiveData };
}
