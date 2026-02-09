import chalk from 'chalk';
import ora from 'ora';
import { OfflineQueueService } from '../services/OfflineQueueService.js';
import { BlockchainService } from '../services/BlockchainService.js';
import { loadConfig, saveConfig } from '../utils/config.js';

export async function syncCommand(): Promise<void> {
  const queueService = new OfflineQueueService();
  const queue = queueService.getQueue();
  const pending = queue.filter(q => q.status === 'pending');

  if (pending.length === 0) {
    console.log(chalk.green('✓ No pending checkpoints to sync'));
    return;
  }

  console.log(chalk.bold(`\n📤 Syncing ${pending.length} pending checkpoint(s)...\n`));

  const blockchainService = new BlockchainService();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    const spinner = ora(`Syncing: ${item.summary}`).start();

    try {
      queueService.updateStatus(item.id, 'syncing');
      
      const result = await blockchainService.attestVibe(item.summary, item.logs);
      
      spinner.succeed(chalk.green(`Synced: ${item.summary}`));
      console.log(chalk.gray(`  TX: ${result.txHash}`));
      console.log(chalk.gray(`  Gas: ${result.gasUsed}`));
      
      queueService.removeFromQueue(item.id);
      synced++;

      const config = loadConfig();
      config.stats.totalCheckpoints++;
      config.stats.totalGasSpent = (
        parseFloat(config.stats.totalGasSpent) + parseFloat(result.cost)
      ).toFixed(6);
      saveConfig(config);

    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${item.summary}`));
      console.log(chalk.gray(`  Error: ${error}`));
      queueService.updateStatus(item.id, 'failed', String(error));
      failed++;
    }
  }

  console.log(chalk.bold(`\n📊 Sync Summary:`));
  console.log(chalk.green(`  ✓ Synced: ${synced}`));
  if (failed > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failed}`));
  }
}

export async function syncStatusCommand(): Promise<void> {
  const queueService = new OfflineQueueService();
  const queue = queueService.getQueue();

  if (queue.length === 0) {
    console.log(chalk.green('✓ No queued checkpoints'));
    return;
  }

  console.log(chalk.bold('\n📋 Offline Queue\n'));

  for (const item of queue) {
    const statusColor = item.status === 'pending' ? chalk.yellow : 
                       item.status === 'syncing' ? chalk.blue : chalk.red;
    
    console.log(`${statusColor(item.status.toUpperCase())} - ${item.summary}`);
    console.log(chalk.gray(`  Created: ${new Date(item.timestamp * 1000).toLocaleString()}`));
    console.log(chalk.gray(`  Logs: ${item.logs.length}`));
    if (item.error) {
      console.log(chalk.red(`  Error: ${item.error}`));
    }
    if (item.retries > 0) {
      console.log(chalk.gray(`  Retries: ${item.retries}`));
    }
    console.log();
  }

  const pending = queue.filter(q => q.status === 'pending').length;
  console.log(chalk.gray(`Total pending: ${pending}`));
}
