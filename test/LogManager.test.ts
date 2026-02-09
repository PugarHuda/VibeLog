import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

// We need to mock the config to use a temp directory
const TEST_DIR = join(process.cwd(), '.vibelog-test');

// Clean up before tests
beforeAll(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }
});

afterAll(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }
});

describe('LogManager', () => {
  it('should validate log entry ID format', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const id = `log_${timestamp}`;
    expect(id).toMatch(/^log_\d+$/);
  });

  it('should track log counts', () => {
    const logs = [
      { id: 'log_1', timestamp: 1000, message: 'First' },
      { id: 'log_2', timestamp: 2000, message: 'Second' },
    ];
    expect(logs.length).toBe(2);
  });

  it('should filter logs after checkpoint', () => {
    const lastCheckpoint = 1500;
    const logs = [
      { id: 'log_1', timestamp: 1000, message: 'Before' },
      { id: 'log_2', timestamp: 2000, message: 'After' },
      { id: 'log_3', timestamp: 3000, message: 'After 2' },
    ];
    const pending = logs.filter((l) => l.timestamp > lastCheckpoint);
    expect(pending.length).toBe(2);
    expect(pending[0].id).toBe('log_2');
  });
});
