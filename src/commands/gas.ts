import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../utils/config.js';
import { ethers } from 'ethers';
import { GasOptimizer } from '../services/GasOptimizer.js';

export async function gasCommand(): Promise<void> {
  const spinner = ora('Fetching gas prices...').start();

  try {
    const config = loadConfig();
    const rpcUrl = process.env.BSC_RPC_URL || config.network.rpcUrl;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const optimizer = new GasOptimizer(provider);
    const estimate = await optimizer.getOptimalGasPrice();

    spinner.succeed('Gas prices fetched');

    console.log(chalk.bold('\n⛽ BSC Gas Prices\n'));
    
    // Current gas price
    console.log(chalk.cyan('Current Gas Price:'), chalk.yellow(optimizer.formatGasPrice(estimate.gasPrice)));
    
    // Estimated cost
    console.log(chalk.cyan('Estimated Cost:'), chalk.yellow(`${estimate.estimatedCost} BNB (~$${estimate.estimatedCostUSD})`));
    
    // Gas limit
    console.log(chalk.cyan('Gas Limit:'), chalk.gray(estimate.gasLimit.toString()));
    
    // Network
    console.log(chalk.cyan('Network:'), chalk.gray(config.network.name));

    // Recommendation
    const recColor = estimate.recommendation === 'low' ? chalk.green : 
                     estimate.recommendation === 'medium' ? chalk.yellow : chalk.red;
    console.log(chalk.cyan('\nRecommendation:'), recColor(optimizer.getRecommendationMessage(estimate.recommendation)));

    // Comparison with Ethereum
    console.log(chalk.cyan('\n💰 Cost Comparison:'));
    console.log(chalk.gray('  BSC:'), chalk.green(`$${estimate.estimatedCostUSD}`));
    console.log(chalk.gray('  ' + optimizer.compareWithEthereum(estimate.estimatedCostUSD)));

    // Tips
    console.log(chalk.bold('\n💡 Tips:'));
    console.log(chalk.gray('  • Use offline mode during high gas prices'));
    console.log(chalk.gray('  • Sync later when gas is cheaper'));
    console.log(chalk.gray('  • BSC gas is typically lowest during off-peak hours'));

  } catch (error) {
    spinner.fail('Failed to fetch gas prices');
    console.log(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
}

export async function gasWaitCommand(maxGwei?: number): Promise<void> {
  const config = loadConfig();
  const rpcUrl = process.env.BSC_RPC_URL || config.network.rpcUrl;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const optimizer = new GasOptimizer(provider);
  const targetGwei = maxGwei || 5;

  console.log(chalk.bold(`\n⏳ Waiting for gas price to drop below ${targetGwei} Gwei...\n`));
  
  const spinner = ora('Monitoring gas prices...').start();

  const success = await optimizer.waitForLowerGas(targetGwei, 300000); // 5 min timeout

  if (success) {
    spinner.succeed(chalk.green(`Gas price is now below ${targetGwei} Gwei!`));
    console.log(chalk.gray('\nYou can now submit your checkpoint with optimal gas prices.'));
  } else {
    spinner.warn(chalk.yellow('Timeout reached. Gas price did not drop.'));
    console.log(chalk.gray('\nConsider using offline mode: vibe checkpoint --offline'));
  }
}
