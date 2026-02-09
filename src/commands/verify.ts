import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, existsSync } from 'fs';
import { isInitialized, loadConfig } from '../utils/config.js';
import { LogManager } from '../services/LogManager.js';
import { BlockchainService } from '../services/BlockchainService.js';
import { NETWORKS } from '../types/index.js';

export async function verifyCommand(filePath?: string): Promise<void> {
  if (!isInitialized()) {
    console.log(chalk.red('❌ VibeLog not initialized. Run `vibe init` first.'));
    process.exit(1);
  }

  const config = loadConfig();

  if (
    !config.network.contractAddress ||
    config.network.contractAddress === '0x0000000000000000000000000000000000000000'
  ) {
    console.log(chalk.red('❌ No contract address configured.'));
    process.exit(1);
  }

  const spinner = ora('Verifying build log against blockchain...').start();

  try {
    const logManager = new LogManager();
    const blockchain = new BlockchainService();
    const localCheckpoints = logManager.getAllCheckpoints();

    if (localCheckpoints.length === 0) {
      spinner.warn('No checkpoints found to verify.');
      console.log(chalk.gray('   Create checkpoints first with: vibe checkpoint "summary"'));
      return;
    }

    // Verify onchain count
    spinner.text = 'Querying blockchain...';
    const onchainCount = await blockchain.getCheckpointCount(config.wallet.address);

    console.log(
      chalk.blue(`\n🔍 Verifying ${localCheckpoints.length} checkpoints against blockchain...\n`)
    );

    let allVerified = true;

    for (let i = 0; i < localCheckpoints.length; i++) {
      const local = localCheckpoints[i];
      spinner.text = `Verifying checkpoint #${i + 1}...`;

      if (i >= onchainCount) {
        spinner.stop();
        console.log(chalk.red(`Checkpoint #${i + 1} (${local.summary}):`));
        console.log(chalk.red(`   ❌ NOT FOUND onchain`));
        allVerified = false;
        spinner.start();
        continue;
      }

      try {
        const onchain = await blockchain.verifyCheckpoint(config.wallet.address, i);
        spinner.stop();

        const date = new Date(local.timestamp * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        });

        console.log(chalk.cyan(`Checkpoint #${i + 1} (${date}):`));
        console.log(chalk.gray(`   Local hash:   ${local.logHash.substring(0, 18)}...`));
        console.log(chalk.gray(`   Onchain hash: ${onchain.logHash.substring(0, 18)}...`));
        console.log(chalk.gray(`   Block: #${local.blockchain.blockNumber}`));

        const hashMatch = local.logHash.toLowerCase() === onchain.logHash.toLowerCase();

        if (hashMatch) {
          console.log(chalk.green(`   ✅ VERIFIED!`));
        } else {
          console.log(chalk.red(`   ❌ HASH MISMATCH`));
          allVerified = false;
        }
        console.log();
        spinner.start();
      } catch (error: any) {
        spinner.stop();
        console.log(chalk.red(`Checkpoint #${i + 1}: ❌ Verification failed - ${error.message}`));
        allVerified = false;
        spinner.start();
      }
    }

    spinner.stop();

    // Final verdict
    const network = NETWORKS[config.network.name];
    const explorerUrl = network?.explorerUrl || 'https://bscscan.com';

    console.log('━'.repeat(50));
    if (allVerified) {
      console.log(chalk.green.bold('🎉 BUILD LOG AUTHENTICITY CONFIRMED!\n'));
      console.log(chalk.green('All checkpoints match onchain records.'));
      console.log(chalk.green('Timeline is legitimate (cannot be backdated).'));
      console.log(chalk.green('This project was genuinely built during the hackathon period.'));
    } else {
      console.log(chalk.red.bold('⚠️  VERIFICATION INCOMPLETE\n'));
      console.log(chalk.yellow('Some checkpoints could not be verified.'));
      console.log(chalk.yellow('This may indicate local data was modified after checkpoint.'));
    }
    console.log('━'.repeat(50));

    console.log(chalk.gray(`\nContract: ${explorerUrl}/address/${config.network.contractAddress}`));
    console.log(chalk.gray(`Builder: ${config.wallet.address}`));
    console.log(chalk.gray(`Total checkpoints: ${localCheckpoints.length} local, ${onchainCount} onchain`));
  } catch (error: any) {
    spinner.fail('Verification failed');
    console.log(chalk.red(`   Error: ${error.message}`));
    process.exit(1);
  }
}
