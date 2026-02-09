import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { isInitialized, loadConfig, sanitizeSummary } from '../utils/config.js';
import { generateLogHash } from '../utils/crypto.js';
import { LogManager } from '../services/LogManager.js';
import { BlockchainService } from '../services/BlockchainService.js';
import { NETWORKS } from '../types/index.js';

export async function checkpointCommand(summary: string): Promise<void> {
  if (!isInitialized()) {
    console.log(chalk.red('❌ VibeLog not initialized. Run `vibe init` first.'));
    process.exit(1);
  }

  const config = loadConfig();
  const logManager = new LogManager();

  // Check contract
  if (
    !config.network.contractAddress ||
    config.network.contractAddress === '0x0000000000000000000000000000000000000000'
  ) {
    console.log(chalk.red('❌ No contract address configured.'));
    console.log(chalk.yellow('   Deploy with: npm run deploy:testnet'));
    console.log(chalk.yellow('   Then set CONTRACT_ADDRESS in .env'));
    process.exit(1);
  }

  // Get pending logs
  const pendingLogs = logManager.getLogsSinceCheckpoint();

  if (pendingLogs.length === 0) {
    console.log(chalk.yellow('⚠️  No new logs since last checkpoint.'));
    console.log(chalk.gray('   Add logs first with: vibe log "your message"'));
    return;
  }

  console.log(chalk.blue('\n📊 Preparing checkpoint...\n'));

  // Session summary
  const totalAdded = pendingLogs.reduce((s, l) => s + (l.diff?.linesAdded || 0), 0);
  const totalDeleted = pendingLogs.reduce((s, l) => s + (l.diff?.linesDeleted || 0), 0);
  const firstLog = pendingLogs[0];
  const lastLog = pendingLogs[pendingLogs.length - 1];
  const timePeriodMin = Math.round((lastLog.timestamp - firstLog.timestamp) / 60);
  const hours = Math.floor(timePeriodMin / 60);
  const mins = timePeriodMin % 60;

  console.log(chalk.cyan(`📦 Session summary:`));
  console.log(chalk.gray(`   • Logs collected: ${pendingLogs.length}`));
  console.log(chalk.gray(`   • Time period: ${hours > 0 ? `${hours}h ` : ''}${mins}m`));
  console.log(chalk.gray(`   • Code changes: +${totalAdded}/-${totalDeleted} lines`));

  // Generate hash
  const logHash = generateLogHash(pendingLogs);
  console.log(chalk.cyan(`\n🔐 Content hash: ${logHash.substring(0, 18)}...`));

  // Sanitize summary
  const { sanitized, hadSensitiveData } = sanitizeSummary(summary);
  if (hadSensitiveData) {
    console.log(chalk.red('\n⚠️  Sensitive data detected and redacted!'));
    console.log(chalk.yellow(`   Original: "${summary}"`));
    console.log(chalk.green(`   Sanitized: "${sanitized}"`));
  }

  // Privacy check
  console.log(chalk.yellow(`\n⚠️  Privacy check:`));
  console.log(chalk.gray(`   Summary (will be PUBLIC): "${sanitized}"`));
  console.log(chalk.gray('   This summary will be stored onchain permanently.'));

  const { proceed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with onchain submission?',
      default: true,
    },
  ]);

  if (!proceed) {
    console.log(chalk.gray('Checkpoint cancelled.'));
    return;
  }

  // Submit to blockchain
  const spinner = ora('Submitting to BSC...').start();

  try {
    const blockchain = new BlockchainService();

    // Estimate gas
    spinner.text = 'Estimating gas...';
    const gasEstimate = await blockchain.estimateGas(sanitized, logHash);
    spinner.text = `Gas estimate: ~${gasEstimate.toString()} wei`;

    // Submit
    spinner.text = 'Submitting transaction...';
    const result = await blockchain.attestVibe(sanitized, pendingLogs);

    spinner.succeed('Transaction confirmed!');

    // Save checkpoint
    const checkpointId = logManager.getNextCheckpointId();
    logManager.saveCheckpoint({
      id: checkpointId,
      timestamp: Math.floor(Date.now() / 1000),
      summary: sanitized,
      logHash,
      logs: pendingLogs.map((l) => l.id),
      blockchain: {
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        cost: result.cost,
      },
    });

    const network = NETWORKS[config.network.name];
    const explorerUrl = network?.explorerUrl || 'https://bscscan.com';

    console.log(chalk.green('\n🎉 CHECKPOINT STORED!\n'));
    console.log(chalk.cyan('📋 Details:'));
    console.log(chalk.gray(`   TxHash: ${result.txHash}`));
    console.log(chalk.gray(`   Explorer: ${explorerUrl}/tx/${result.txHash}`));
    console.log(chalk.gray(`   Block: #${result.blockNumber}`));
    console.log(chalk.gray(`   Cost: ${result.cost}`));
    console.log(chalk.gray(`   Hash: ${logHash.substring(0, 18)}...`));
    console.log(chalk.gray(`   Summary: "${sanitized}"`));
    console.log(chalk.gray(`   Logs included: ${pendingLogs.length}`));
  } catch (error: any) {
    spinner.fail('Transaction failed');
    console.log(chalk.red(`   Error: ${error.message}`));

    if (error.message.includes('insufficient funds')) {
      const network = NETWORKS[config.network.name];
      console.log(chalk.yellow('\n💡 You need BNB for gas fees.'));
      if (config.network.name === 'bsc-testnet') {
        console.log(chalk.yellow('   Get testnet BNB: https://www.bnbchain.org/en/testnet-faucet'));
      } else {
        console.log(chalk.yellow('   Get BNB from an exchange or bridge'));
      }
    }
    process.exit(1);
  }
}
