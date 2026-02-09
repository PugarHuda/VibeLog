import { createHash } from 'crypto';
import type { LogEntry } from '../types/index.js';

export function generateLogHash(logs: LogEntry[]): string {
  const data = JSON.stringify(
    logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp,
      message: l.message,
      commit: l.commit?.hash,
      diff: l.diff,
    }))
  );
  const hash = createHash('sha256').update(data).digest('hex');
  return `0x${hash}`;
}

export function hashString(input: string): string {
  return `0x${createHash('sha256').update(input).digest('hex')}`;
}
