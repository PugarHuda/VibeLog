import { generateLogHash, hashString } from '../src/utils/crypto.js';
import type { LogEntry } from '../src/types/index.js';

describe('Crypto Utils', () => {
  const mockLog: LogEntry = {
    id: 'log_1707574425',
    timestamp: 1707574425,
    message: 'Test log entry',
    commit: {
      hash: 'a3b2c1d',
      message: 'Test commit',
      author: 'test',
      date: '2026-02-10',
    },
    diff: {
      filesChanged: 2,
      linesAdded: 50,
      linesDeleted: 10,
      files: ['src/test.ts', 'src/index.ts'],
    },
  };

  it('should generate a valid SHA-256 hash from logs', () => {
    const hash = generateLogHash([mockLog]);
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('should generate consistent hashes for same input', () => {
    const hash1 = generateLogHash([mockLog]);
    const hash2 = generateLogHash([mockLog]);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different inputs', () => {
    const log2: LogEntry = { ...mockLog, id: 'log_9999999999', message: 'Different' };
    const hash1 = generateLogHash([mockLog]);
    const hash2 = generateLogHash([log2]);
    expect(hash1).not.toBe(hash2);
  });

  it('should hash strings correctly', () => {
    const hash = hashString('hello world');
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
