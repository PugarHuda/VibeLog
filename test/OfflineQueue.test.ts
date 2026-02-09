import { OfflineQueueService } from '../src/services/OfflineQueueService.js';
import type { LogEntry } from '../src/types/index.js';

describe('OfflineQueueService', () => {
  let queueService: OfflineQueueService;

  it('should create OfflineQueueService instance', () => {
    queueService = new OfflineQueueService();
    expect(queueService).toBeDefined();
  });

  it('should have getPendingCount method', () => {
    queueService = new OfflineQueueService();
    expect(typeof queueService.getPendingCount).toBe('function');
  });

  it('should have getQueue method', () => {
    queueService = new OfflineQueueService();
    expect(typeof queueService.getQueue).toBe('function');
  });

  it('should have addToQueue method', () => {
    queueService = new OfflineQueueService();
    expect(typeof queueService.addToQueue).toBe('function');
  });

  it('should have clearQueue method', () => {
    queueService = new OfflineQueueService();
    expect(typeof queueService.clearQueue).toBe('function');
  });
});
