import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getVibelogDir } from '../utils/config.js';
import type { LogEntry } from '../types/index.js';

export interface QueuedCheckpoint {
  id: string;
  timestamp: number;
  summary: string;
  logs: LogEntry[];
  status: 'pending' | 'syncing' | 'failed';
  retries: number;
  error?: string;
}

export class OfflineQueueService {
  private queuePath: string;

  constructor() {
    this.queuePath = join(getVibelogDir(), 'offline-queue.json');
  }

  private loadQueue(): QueuedCheckpoint[] {
    if (!existsSync(this.queuePath)) return [];
    try {
      const raw = readFileSync(this.queuePath, 'utf-8');
      return JSON.parse(raw) as QueuedCheckpoint[];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedCheckpoint[]): void {
    writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
  }

  addToQueue(summary: string, logs: LogEntry[]): string {
    const queue = this.loadQueue();
    const id = `offline-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    queue.push({
      id,
      timestamp: Math.floor(Date.now() / 1000),
      summary,
      logs,
      status: 'pending',
      retries: 0,
    });

    this.saveQueue(queue);
    return id;
  }

  getPendingCount(): number {
    const queue = this.loadQueue();
    return queue.filter(q => q.status === 'pending').length;
  }

  getQueue(): QueuedCheckpoint[] {
    return this.loadQueue();
  }

  updateStatus(id: string, status: 'syncing' | 'failed', error?: string): void {
    const queue = this.loadQueue();
    const item = queue.find(q => q.id === id);
    if (item) {
      item.status = status;
      if (error) item.error = error;
      if (status === 'failed') item.retries++;
      this.saveQueue(queue);
    }
  }

  removeFromQueue(id: string): void {
    const queue = this.loadQueue();
    const filtered = queue.filter(q => q.id !== id);
    this.saveQueue(filtered);
  }

  clearQueue(): void {
    this.saveQueue([]);
  }
}
