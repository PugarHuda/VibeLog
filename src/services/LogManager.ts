import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getLogsDir, getCheckpointsDir, loadConfig, saveConfig } from '../utils/config.js';
import type { LogEntry, Checkpoint } from '../types/index.js';

export class LogManager {
  async createEntry(data: {
    message: string;
    commit?: LogEntry['commit'];
    diff?: LogEntry['diff'];
    aiContext?: LogEntry['aiContext'];
    aiSummary?: string;
  }): Promise<LogEntry> {
    const timestamp = Math.floor(Date.now() / 1000);
    const entry: LogEntry = {
      id: `log_${timestamp}`,
      timestamp,
      message: data.message,
      commit: data.commit,
      diff: data.diff,
      aiContext: data.aiContext,
      aiSummary: data.aiSummary,
    };

    const filePath = join(getLogsDir(), `${entry.id}.json`);
    writeFileSync(filePath, JSON.stringify(entry, null, 2));

    // Update stats
    const config = loadConfig();
    config.stats.totalLogs++;
    saveConfig(config);

    return entry;
  }

  getAllLogs(): LogEntry[] {
    const logsDir = getLogsDir();
    if (!existsSync(logsDir)) return [];

    const files = readdirSync(logsDir).filter((f) => f.endsWith('.json')).sort();
    return files.map((f) => {
      const raw = readFileSync(join(logsDir, f), 'utf-8');
      return JSON.parse(raw) as LogEntry;
    });
  }

  getLogsSinceCheckpoint(): LogEntry[] {
    const config = loadConfig();
    const allLogs = this.getAllLogs();
    const lastCheckpoint = config.lastCheckpoint || 0;
    return allLogs.filter((l) => l.timestamp > lastCheckpoint);
  }

  getLogById(id: string): LogEntry | null {
    const filePath = join(getLogsDir(), `${id}.json`);
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as LogEntry;
  }

  saveCheckpoint(checkpoint: Checkpoint): void {
    const filePath = join(getCheckpointsDir(), `${checkpoint.id}.json`);
    writeFileSync(filePath, JSON.stringify(checkpoint, null, 2));

    const config = loadConfig();
    config.lastCheckpoint = checkpoint.timestamp;
    config.stats.totalCheckpoints++;
    const currentGas = BigInt(config.stats.totalGasSpent || '0');
    const newGas = BigInt(checkpoint.blockchain.gasUsed);
    config.stats.totalGasSpent = (currentGas + newGas).toString();
    saveConfig(config);
  }

  getAllCheckpoints(): Checkpoint[] {
    const dir = getCheckpointsDir();
    if (!existsSync(dir)) return [];

    const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
    return files.map((f) => {
      const raw = readFileSync(join(dir, f), 'utf-8');
      return JSON.parse(raw) as Checkpoint;
    });
  }

  getNextCheckpointId(): string {
    const checkpoints = this.getAllCheckpoints();
    const num = checkpoints.length + 1;
    return `checkpoint_${String(num).padStart(3, '0')}`;
  }

  getLogCount(): number {
    return this.getAllLogs().length;
  }
}
