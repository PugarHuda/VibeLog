export interface Config {
  version: string;
  wallet: {
    address: string;
  };
  network: {
    name: 'bsc-mainnet' | 'bsc-testnet';
    rpcUrl: string;
    contractAddress: string;
    chainId: number;
  };
  ai: {
    provider: 'gemini' | 'none';
    enabled: boolean;
  };
  initialized: string;
  lastCheckpoint?: number;
  stats: {
    totalLogs: number;
    totalCheckpoints: number;
    totalGasSpent: string;
  };
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  commit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  diff?: {
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
    files: string[];
  };
  aiContext?: {
    tool?: string;
    prompt?: string;
  };
  aiSummary?: string;
}

export interface Checkpoint {
  id: string;
  timestamp: number;
  summary: string;
  logHash: string;
  logs: string[];
  blockchain: {
    txHash: string;
    blockNumber: number;
    gasUsed: string;
    cost: string;
  };
}

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  contractAddress: string;
  explorerUrl: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  'bsc-mainnet': {
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    chainId: 56,
    contractAddress: '', // Set after deployment
    explorerUrl: 'https://bscscan.com',
  },
  'bsc-testnet': {
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
    chainId: 97,
    contractAddress: '', // Set after deployment
    explorerUrl: 'https://testnet.bscscan.com',
  },
};

export const VIBEPROOF_ABI = [
  "function attestVibe(string memory summary, bytes32 logHash) external",
  "function getCheckpointCount(address builder) external view returns (uint256)",
  "function getCheckpoint(address builder, uint256 index) external view returns (tuple(bytes32 logHash, string summary, uint256 timestamp, uint256 sessionCount))",
  "event VibeAttested(address indexed builder, bytes32 logHash, string summary, uint256 timestamp, uint256 checkpointIndex)"
];
