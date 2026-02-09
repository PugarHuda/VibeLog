import { ethers } from 'ethers';

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCost: string;
  estimatedCostUSD: string;
  recommendation: 'low' | 'medium' | 'high';
}

export class GasOptimizer {
  private provider: ethers.JsonRpcProvider;
  private bnbPriceUSD: number = 300; // Fallback price

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider;
  }

  async fetchBNBPrice(): Promise<number> {
    try {
      // Fetch from CoinGecko API (free, no key needed)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd'
      );
      const data: any = await response.json();
      this.bnbPriceUSD = data.binancecoin?.usd || 300;
      return this.bnbPriceUSD;
    } catch {
      return this.bnbPriceUSD; // Return fallback
    }
  }

  async getOptimalGasPrice(): Promise<GasEstimate> {
    // Fetch current BNB price
    await this.fetchBNBPrice();

    // Get current gas price from network
    const feeData = await this.provider.getFeeData();
    
    // BSC uses legacy gas pricing (not EIP-1559)
    const gasPrice = feeData.gasPrice || BigInt(3000000000); // 3 Gwei default
    
    // Estimate gas limit for attestVibe function
    const gasLimit = BigInt(100000); // Our contract uses ~100k gas

    // Calculate costs
    const estimatedCostWei = gasLimit * gasPrice;
    const estimatedCostBNB = ethers.formatEther(estimatedCostWei);
    const estimatedCostUSD = (parseFloat(estimatedCostBNB) * this.bnbPriceUSD).toFixed(4);

    // Determine recommendation based on gas price
    let recommendation: 'low' | 'medium' | 'high';
    const gasPriceGwei = Number(gasPrice) / 1e9;
    
    if (gasPriceGwei < 5) {
      recommendation = 'low';
    } else if (gasPriceGwei < 10) {
      recommendation = 'medium';
    } else {
      recommendation = 'high';
    }

    return {
      gasLimit,
      gasPrice,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: BigInt(0), // BSC doesn't use priority fees
      estimatedCost: estimatedCostBNB,
      estimatedCostUSD,
      recommendation,
    };
  }

  async waitForLowerGas(maxGasPriceGwei: number = 5, timeoutMs: number = 60000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const feeData = await this.provider.getFeeData();
      const currentGasPrice = feeData.gasPrice || BigInt(0);
      const currentGasPriceGwei = Number(currentGasPrice) / 1e9;

      if (currentGasPriceGwei <= maxGasPriceGwei) {
        return true;
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return false; // Timeout reached
  }

  formatGasPrice(gasPrice: bigint): string {
    const gwei = Number(gasPrice) / 1e9;
    return `${gwei.toFixed(2)} Gwei`;
  }

  compareWithEthereum(bscCostUSD: string): string {
    // Ethereum typically costs 50-100x more
    const ethCostUSD = (parseFloat(bscCostUSD) * 75).toFixed(2);
    const savings = ((1 - parseFloat(bscCostUSD) / parseFloat(ethCostUSD)) * 100).toFixed(1);
    return `Ethereum would cost ~$${ethCostUSD} (${savings}% savings on BSC!)`;
  }

  getRecommendationMessage(recommendation: 'low' | 'medium' | 'high'): string {
    switch (recommendation) {
      case 'low':
        return '✅ Great time to submit! Gas prices are low.';
      case 'medium':
        return '⚠️  Gas prices are moderate. Consider waiting for lower prices.';
      case 'high':
        return '🔴 Gas prices are high. Recommend waiting or using offline mode.';
    }
  }
}
