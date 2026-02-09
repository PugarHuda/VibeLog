import { ethers } from 'ethers';
import { loadConfig } from '../utils/config.js';
import { generateLogHash } from '../utils/crypto.js';
import { VIBEPROOF_ABI } from '../types/index.js';
import type { LogEntry } from '../types/index.js';

export interface TxResult {
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  cost: string;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(privateKey?: string) {
    const config = loadConfig();
    const rpcUrl = process.env.BSC_RPC_URL || config.network.rpcUrl;
    const contractAddress = process.env.CONTRACT_ADDRESS || config.network.contractAddress;

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    const pk = privateKey || process.env.PRIVATE_KEY;
    if (!pk) throw new Error('Private key not found. Set PRIVATE_KEY env variable.');
    this.wallet = new ethers.Wallet(pk, this.provider);
    this.contract = new ethers.Contract(contractAddress, VIBEPROOF_ABI, this.wallet);
  }

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  async getAddress(): Promise<string> {
    return this.wallet.address;
  }

  async estimateGas(summary: string, logHash: string): Promise<bigint> {
    try {
      const gas = await this.contract.attestVibe.estimateGas(summary, logHash);
      return gas;
    } catch {
      return BigInt(100000); // Fallback estimate
    }
  }

  async attestVibe(summary: string, logs: LogEntry[]): Promise<TxResult> {
    const logHash = generateLogHash(logs);
    const hashBytes = logHash;

    const tx = await this.contract.attestVibe(summary, hashBytes);
    const receipt = await tx.wait();

    const gasPrice = receipt.gasPrice || BigInt(1000000008);
    const cost = ethers.formatEther(receipt.gasUsed * gasPrice);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      cost: `$${(parseFloat(cost) * 300).toFixed(6)}`, // Rough BNB/USD estimate
    };
  }

  async verifyCheckpoint(
    builderAddress: string,
    index: number
  ): Promise<{
    logHash: string;
    summary: string;
    timestamp: number;
    sessionCount: number;
  }> {
    const checkpoint = await this.contract.getCheckpoint(builderAddress, index);
    return {
      logHash: checkpoint.logHash,
      summary: checkpoint.summary,
      timestamp: Number(checkpoint.timestamp),
      sessionCount: Number(checkpoint.sessionCount),
    };
  }

  async getCheckpointCount(builderAddress: string): Promise<number> {
    const count = await this.contract.getCheckpointCount(builderAddress);
    return Number(count);
  }

  generateHash(logs: LogEntry[]): string {
    return generateLogHash(logs);
  }
}
