import { generateLogHash } from '../src/utils/crypto.js';
import type { LogEntry } from '../src/types/index.js';

describe('BlockchainService - Hash Generation', () => {
  const mockLog1: LogEntry = {
    id: 'log_1707574425',
    timestamp: 1707574425,
    message: 'Implemented vault contract',
    commit: {
      hash: 'a3b2c1d',
      message: 'Add vault contract',
      author: 'builder',
      date: '2026-02-10',
    },
    diff: {
      filesChanged: 1,
      linesAdded: 187,
      linesDeleted: 12,
      files: ['src/Vault.sol'],
    },
  };

  const mockLog2: LogEntry = {
    id: 'log_1707578025',
    timestamp: 1707578025,
    message: 'Added reentrancy guard',
    commit: {
      hash: 'b4c3d2e',
      message: 'Fix reentrancy',
      author: 'builder',
      date: '2026-02-10',
    },
    diff: {
      filesChanged: 2,
      linesAdded: 45,
      linesDeleted: 3,
      files: ['src/Vault.sol', 'src/Guard.sol'],
    },
  };

  it('should generate correct hash format', () => {
    const hash = generateLogHash([mockLog1, mockLog2]);
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('should produce deterministic hashes', () => {
    const hash1 = generateLogHash([mockLog1, mockLog2]);
    const hash2 = generateLogHash([mockLog1, mockLog2]);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different log sets', () => {
    const hash1 = generateLogHash([mockLog1]);
    const hash2 = generateLogHash([mockLog1, mockLog2]);
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty logs array', () => {
    const hash = generateLogHash([]);
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
