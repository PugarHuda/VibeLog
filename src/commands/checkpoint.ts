import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { isInitialized, loadConfig, sanitizeSummary, saveConfig } from '../utils/config.js';
import { generateLogHash } from '../utils/crypto.js';
import { LogManager } from '../services/LogManager.js';
import { BlockchainService } from '../services/BlockchainService.js';
import { OfflineQueueService } from '../services/OfflineQueueService.js';
import { NotificationService } from '../services/NotificationService.js';
import { NETWORKS } from '../types/index.js';

export async function checkpointCommand(summary: string, options?: { dryRun?: boolean }): Promise<void> {
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

  // Dry-run mode: estimate gas and exit
  if (options?.dryRun) {
    const spinner = ora('Estimating gas...').start();
    try {
      const blockchain = new BlockchainService();
      const gasEstimate = await blockchain.estimateGas(sanitized, logHash);
      const balance = await blockchain.getBalance();
      spinner.succeed('Gas estimation complete');
      console.log(chalk.cyan('\n📊 Dry-run results:'));
      console.log(chalk.gray(`   Gas estimate: ~${gasEstimate.toString()} units`));
      console.log(chalk.gray(`   Est. cost: ~$${(Number(gasEstimate) * 3e-9 * 300).toFixed(6)}`));
      console.log(chalk.gray(`   Wallet balance: ${parseFloat(balance).toFixed(6)} BNB`));
      console.log(chalk.green('\n✅ Ready to submit. Run without --dry-run to proceed.'));
    } catch (error: unknown) {
      spinner.fail('Gas estimation failed');
      const msg = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`   Error: ${msg}`));
    }
    return;
  }

  const { proceed, saveOffline } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with onchain submission?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'saveOffline',
      message: 'Save to offline queue if submission fails?',
      default: true,
      when: (answers) => answers.proceed,
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

    // Update stats
    config.stats.totalCheckpoints++;
    config.stats.totalGasSpent = (parseFloat(config.stats.totalGasSpent) + parseFloat(result.cost)).toFixed(6);
    config.lastCheckpoint = Math.floor(Date.now() / 1000);
    saveConfig(config);

    // Check notifications
    const notificationService = new NotificationService();
    if (notificationService.shouldNotifyMilestone(config.stats.totalCheckpoints)) {
      console.log(chalk.yellow(`\n${notificationService.generateReminderMessage('milestone', { count: config.stats.totalCheckpoints })}`));
    }

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

    // Save to offline queue if enabled
    if (saveOffline) {
      const queueService = new OfflineQueueService();
      const queueId = queueService.addToQueue(sanitized, pendingLogs);
      console.log(chalk.yellow(`\n💾 Checkpoint saved to offline queue (ID: ${queueId})`));
      console.log(chalk.gray('   Run `vibe sync` when you have internet connection'));
      return;
    }

    process.exit(1);
  }
}
