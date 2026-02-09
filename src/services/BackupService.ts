import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getVibelogDir, getLogsDir, getCheckpointsDir } from '../utils/config.js';
import { createHash } from 'crypto';

export interface BackupMetadata {
  timestamp: number;
  version: string;
  logsCount: number;
  checkpointsCount: number;
  hash: string;
}

export class BackupService {
  private backupDir: string;

  constructor() {
    this.backupDir = join(getVibelogDir(), 'backups');
  }

  createBackup(): string {
    const timestamp = Date.now();
    const backupData = {
      config: this.readConfig(),
      logs: this.readAllLogs(),
      checkpoints: this.readAllCheckpoints(),
      team: this.readTeam(),
      queue: this.readQueue(),
    };

    const backupJson = JSON.stringify(backupData, null, 2);
    const hash = createHash('sha256').update(backupJson).digest('hex').substring(0, 8);
    
    const metadata: BackupMetadata = {
      timestamp,
      version: '1.0.0',
      logsCount: backupData.logs.length,
      checkpointsCount: backupData.checkpoints.length,
      hash,
    };

    const backupFile = join(this.backupDir, `backup-${timestamp}-${hash}.json`);
    
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }

    writeFileSync(backupFile, JSON.stringify({
      metadata,
      data: backupData,
    }, null, 2));

    return backupFile;
  }

  listBackups(): BackupMetadata[] {
    if (!existsSync(this.backupDir)) return [];

    const files = readdirSync(this.backupDir).filter(f => f.startsWith('backup-'));
    
    return files.map(file => {
      const content = readFileSync(join(this.backupDir, file), 'utf-8');
      const backup = JSON.parse(content);
      return backup.metadata as BackupMetadata;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }

  restoreBackup(timestamp: number): void {
    const files = readdirSync(this.backupDir).filter(f => f.includes(`backup-${timestamp}`));
    
    if (files.length === 0) {
      throw new Error('Backup not found');
    }

    const backupFile = join(this.backupDir, files[0]);
    const content = readFileSync(backupFile, 'utf-8');
    const backup = JSON.parse(content);

    this.writeConfig(backup.data.config);
    this.writeAllLogs(backup.data.logs);
    this.writeAllCheckpoints(backup.data.checkpoints);
    if (backup.data.team) this.writeTeam(backup.data.team);
    if (backup.data.queue) this.writeQueue(backup.data.queue);
  }

  private readConfig(): any {
    const path = join(getVibelogDir(), 'config.json');
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : null;
  }

  private readAllLogs(): any[] {
    const logsDir = getLogsDir();
    if (!existsSync(logsDir)) return [];
    
    return readdirSync(logsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(readFileSync(join(logsDir, f), 'utf-8')));
  }

  private readAllCheckpoints(): any[] {
    const checkpointsDir = getCheckpointsDir();
    if (!existsSync(checkpointsDir)) return [];
    
    return readdirSync(checkpointsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(readFileSync(join(checkpointsDir, f), 'utf-8')));
  }

  private readTeam(): any {
    const path = join(getVibelogDir(), 'team.json');
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : null;
  }

  private readQueue(): any {
    const path = join(getVibelogDir(), 'offline-queue.json');
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : null;
  }

  private writeConfig(data: any): void {
    if (data) writeFileSync(join(getVibelogDir(), 'config.json'), JSON.stringify(data, null, 2));
  }

  private writeAllLogs(logs: any[]): void {
    const logsDir = getLogsDir();
    logs.forEach(log => {
      writeFileSync(join(logsDir, `${log.id}.json`), JSON.stringify(log, null, 2));
    });
  }

  private writeAllCheckpoints(checkpoints: any[]): void {
    const checkpointsDir = getCheckpointsDir();
    checkpoints.forEach(cp => {
      writeFileSync(join(checkpointsDir, `${cp.id}.json`), JSON.stringify(cp, null, 2));
    });
  }

  private writeTeam(data: any): void {
    if (data) writeFileSync(join(getVibelogDir(), 'team.json'), JSON.stringify(data, null, 2));
  }

  private writeQueue(data: any): void {
    if (data) writeFileSync(join(getVibelogDir(), 'offline-queue.json'), JSON.stringify(data, null, 2));
  }
}
