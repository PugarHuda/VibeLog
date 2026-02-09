import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ethers } from 'ethers';
import { existsSync } from 'fs';
import {
  isInitialized,
  saveConfig,
  ensureDirectories,
  getVibelogDir,
} from '../utils/config.js';
import { NETWORKS } from '../types/index.js';
import type { Config } from '../types/index.js';
import { GitService } from '../services/GitService.js';
import { printBanner } from '../utils/banner.js';

export async function initCommand(): Promise<void> {
  printBanner();
  console.log(chalk.magenta('✨ Setup Wizard\n'));

  // Check if already initialized
  if (isInitialized()) {
    console.log(chalk.yellow('⚠️  VibeLog already initialized in this directory.'));
    const { reinit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reinit',
        message: 'Reinitialize? (existing logs will be kept)',
        default: false,
      },
    ]);
    if (!reinit) return;
  }

  // Detect project
  const git = new GitService();
  const isGit = await git.isGitRepo();
  const repoInfo = isGit ? await git.getRepoInfo() : null;
  const frameworks = isGit ? await git.detectFramework() : [];

  console.log(chalk.blue(`📁 Detected project: ${process.cwd()}`));
  if (frameworks.length > 0) {
    console.log(chalk.blue(`   Framework: ${frameworks.join(', ')}`));
  }
  if (repoInfo) {
    console.log(chalk.blue(`   Branch: ${repoInfo.branch}`));
  }
  if (!isGit) {
    console.log(chalk.yellow('   ⚠️  Not a git repository. Git features will be limited.'));
  }
  console.log();

  // Network selection
  const { network } = await inquirer.prompt([
    {
      type: 'list',
      name: 'network',
      message: 'Choose network:',
      choices: [
        { name: `BSC Testnet (free - recommended for testing)`, value: 'bsc-testnet' },
        { name: `BSC Mainnet (requires BNB - for submission)`, value: 'bsc-mainnet' },
      ],
    },
  ]);

  const networkConfig = NETWORKS[network];

  // Wallet setup
  console.log(chalk.blue('\n🔑 Wallet Setup:'));
  const { walletOption } = await inquirer.prompt([
    {
      type: 'list',
      name: 'walletOption',
      message: 'Choose wallet setup:',
      choices: [
        { name: 'Import existing wallet (private key)', value: 'import' },
        { name: 'Generate new wallet', value: 'generate' },
      ],
    },
  ]);

  let wallet: ethers.Wallet | ethers.HDNodeWallet;

  if (walletOption === 'import') {
    const { privateKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'privateKey',
        message: 'Enter private key:',
        mask: '•',
        validate: (input: string) => {
          try {
            new ethers.Wallet(input);
            return true;
          } catch {
            return 'Invalid private key. Must be a valid hex string.';
          }
        },
      },
    ]);
    wallet = new ethers.Wallet(privateKey);
  } else {
    wallet = ethers.Wallet.createRandom();
    console.log(chalk.yellow('\n⚠️  SAVE THIS PRIVATE KEY! It will not be shown again.'));
    console.log(chalk.cyan(`   Private Key: ${wallet.privateKey}`));
    console.log(chalk.gray('   Add this to your .env file as PRIVATE_KEY'));
  }

  console.log(chalk.green(`\n✅ Wallet loaded: ${wallet.address}`));

  // Check balance
  const spinner = ora('Checking balance...').start();
  try {
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const balance = await provider.getBalance(wallet.address);
    const balanceStr = ethers.formatEther(balance);
    spinner.succeed(`Balance: ${balanceStr} BNB`);
    if (balance === BigInt(0) && network === 'bsc-testnet') {
      console.log(chalk.yellow('   💡 Get testnet BNB from: https://www.bnbchain.org/en/testnet-faucet'));
    }
  } catch {
    spinner.warn('Could not check balance (network might be unavailable)');
  }

  // Contract address
  let contractAddress = networkConfig.contractAddress;
  if (!contractAddress) {
    const { hasContract } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasContract',
        message: 'Do you have a deployed VibeProof contract address?',
        default: false,
      },
    ]);

    if (hasContract) {
      const { address } = await inquirer.prompt([
        {
          type: 'input',
          name: 'address',
          message: 'Enter contract address:',
          validate: (input: string) =>
            ethers.isAddress(input) ? true : 'Invalid address',
        },
      ]);
      contractAddress = address;
    } else {
      console.log(chalk.yellow('   ℹ️  Deploy with: npm run deploy:testnet'));
      console.log(chalk.yellow('   Then update CONTRACT_ADDRESS in .env'));
      contractAddress = '0x0000000000000000000000000000000000000000';
    }
  }

  // AI setup
  console.log(chalk.blue('\n🤖 AI Setup (Optional - Free):'));
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  let aiEnabled = hasGeminiKey;

  if (!hasGeminiKey) {
    console.log(chalk.gray('   Google Gemini API (free tier: 15 req/min, 1M tokens/day)'));
    console.log(chalk.gray('   Get key: https://aistudio.google.com/apikey'));
    const { setupAi } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupAi',
        message: 'Setup AI summarization? (optional, enhances build narratives)',
        default: false,
      },
    ]);
    if (setupAi) {
      console.log(chalk.gray('   Add GEMINI_API_KEY to your .env file'));
      aiEnabled = true;
    }
  } else {
    console.log(chalk.green('   ✅ Gemini API key detected'));
  }

  // Save config
  ensureDirectories();

  // Auto-add .vibelog to .gitignore
  if (isGit) {
    const gitignorePath = `${process.cwd()}/.gitignore`;
    const { readFileSync, appendFileSync, writeFileSync: writeGi } = await import('fs');
    if (existsSync(gitignorePath)) {
      const content = readFileSync(gitignorePath, 'utf-8');
      if (!content.includes('.vibelog')) {
        appendFileSync(gitignorePath, '\n# VibeLog local data\n.vibelog/\n');
        console.log(chalk.green('   ✅ Added .vibelog/ to .gitignore'));
      }
    } else {
      writeGi(gitignorePath, '# VibeLog local data\n.vibelog/\n');
      console.log(chalk.green('   ✅ Created .gitignore with .vibelog/'));
    }
  }

  const config: Config = {
    version: '1.0.0',
    wallet: {
      address: wallet.address,
    },
    network: {
      name: network as 'bsc-mainnet' | 'bsc-testnet',
      rpcUrl: networkConfig.rpcUrl,
      contractAddress: contractAddress,
      chainId: networkConfig.chainId,
    },
    ai: {
      provider: aiEnabled ? 'gemini' : 'none',
      enabled: aiEnabled,
    },
    initialized: new Date().toISOString(),
    stats: {
      totalLogs: 0,
      totalCheckpoints: 0,
      totalGasSpent: '0',
    },
  };

  saveConfig(config);

  // Create .env if doesn't exist
  const envPath = `${process.cwd()}/.env`;
  if (!existsSync(envPath)) {
    const { createEnv } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createEnv',
        message: 'Create .env file with wallet config?',
        default: true,
      },
    ]);
    if (createEnv) {
      const envContent = [
        `PRIVATE_KEY=${wallet.privateKey}`,
        `CONTRACT_ADDRESS=${contractAddress}`,
        aiEnabled ? `GEMINI_API_KEY=your_key_here` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const { writeFileSync } = await import('fs');
      writeFileSync(envPath, envContent + '\n');
      console.log(chalk.green('   ✅ .env created'));
    }
  }

  // Git hooks prompt
  if (isGit) {
    const { installHooks } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'installHooks',
        message: 'Install git hook to auto-log every commit?',
        default: true,
      },
    ]);
    if (installHooks) {
      const { hooksInstallCommand } = await import('./hooks.js');
      await hooksInstallCommand();
    }
  }

  // Summary
  console.log(chalk.green('\n✅ VibeLog initialized!\n'));
  console.log(chalk.cyan(`   ⛓️  Network: ${networkConfig.name}`));
  console.log(chalk.cyan(`   📁 Data dir: ${getVibelogDir()}`));
  console.log(chalk.cyan(`   🤖 AI: ${aiEnabled ? 'Gemini (free)' : 'Disabled'}`));

  console.log(chalk.gray('\nQuick Start:'));
  console.log(chalk.gray('  vibe log "message"         - Add log entry'));
  console.log(chalk.gray('  vibe checkpoint "summary"  - Store onchain'));
  console.log(chalk.gray('  vibe export               - Generate BUILD_LOG.md'));
  console.log(chalk.gray('  vibe status               - View dashboard'));
}
