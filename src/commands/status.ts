import chalk from 'chalk';
import { ethers } from 'ethers';
import { isInitialized, loadConfig } from '../utils/config.js';
import { LogManager } from '../services/LogManager.js';
import { GitService } from '../services/GitService.js';
import { printBanner } from '../utils/banner.js';
import { NETWORKS } from '../types/index.js';

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

function box(title: string, lines: string[], width = 56): string {
  const inner = width - 2;
  const top = `  ${chalk.gray('┌')}${chalk.gray('─'.repeat(inner))}${chalk.gray('┐')}`;
  const titleLine = `  ${chalk.gray('│')} ${chalk.hex('#f0b90b').bold(title)}${' '.repeat(Math.max(0, inner - 2 - title.length))}${chalk.gray('│')}`;
  const sep = `  ${chalk.gray('├')}${chalk.gray('─'.repeat(inner))}${chalk.gray('┤')}`;
  const bottom = `  ${chalk.gray('└')}${chalk.gray('─'.repeat(inner))}${chalk.gray('┘')}`;

  const contentWidth = inner - 2; // space on each side
  const bodyLines = lines.map(line => {
    const stripped = stripAnsi(line);
    if (stripped.length > contentWidth) {
      // Truncate the visible text but keep it within box
      const overflow = stripped.length - contentWidth;
      const truncated = line.substring(0, line.length - overflow - 3) + '...';
      const trStripped = stripAnsi(truncated);
      const pad = Math.max(0, contentWidth - trStripped.length);
      return `  ${chalk.gray('│')} ${truncated}${' '.repeat(pad)}${chalk.gray('│')}`;
    }
    const pad = Math.max(0, contentWidth - stripped.length);
    return `  ${chalk.gray('│')} ${line}${' '.repeat(pad)}${chalk.gray('│')}`;
  });

  return [top, titleLine, sep, ...bodyLines, bottom].join('\n');
}

export async function statusCommand(): Promise<void> {
  if (!isInitialized()) {
    console.log(chalk.red('❌ VibeLog not initialized. Run `vibe init` first.'));
    process.exit(1);
  }

  printBanner();

  const config = loadConfig();
  const logManager = new LogManager();
  const git = new GitService();

  const allLogs = logManager.getAllLogs();
  const allCheckpoints = logManager.getAllCheckpoints();
  const pendingLogs = logManager.getLogsSinceCheckpoint();

  // Compute total lines changed
  let totalAdded = 0;
  let totalDeleted = 0;
  for (const log of allLogs) {
    if (log.diff) {
      totalAdded += log.diff.linesAdded;
      totalDeleted += log.diff.linesDeleted;
    }
  }

  // Git info
  const isGit = await git.isGitRepo();
  const repoInfo = isGit ? await git.getRepoInfo() : null;

  // Network info
  const networkConfig = NETWORKS[config.network.name];
  const networkLabel = networkConfig ? networkConfig.name : config.network.name;

  // Truncate path for display
  const cwd = process.cwd();
  const displayPath = cwd.length > 40 ? '...' + cwd.substring(cwd.length - 37) : cwd;

  // Balance check
  let balance = 'offline';
  try {
    const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    const bal = await provider.getBalance(config.wallet.address);
    balance = parseFloat(ethers.formatEther(bal)).toFixed(4);
  } catch {
    // Network unavailable
  }

  // Project Info Box
  console.log(box('PROJECT', [
    `${chalk.gray('Path:')}    ${displayPath}`,
    `${chalk.gray('Branch:')}  ${repoInfo ? chalk.cyan(repoInfo.branch) : chalk.dim('N/A')}`,
    `${chalk.gray('Network:')} ${chalk.hex('#f0b90b')(networkLabel)}`,
    `${chalk.gray('Wallet:')}  ${chalk.cyan(config.wallet.address.substring(0, 6) + '...' + config.wallet.address.substring(38))}`,
    `${chalk.gray('Balance:')} ${chalk.green(balance)} BNB`,
  ]));
  console.log();

  // Build Stats Box
  console.log(box('BUILD STATS', [
    `${chalk.white.bold(String(allLogs.length))} log entries  ${chalk.gray('|')}  ${chalk.white.bold(String(allCheckpoints.length))} checkpoints`,
    `${chalk.green('+' + totalAdded)} ${chalk.red('-' + totalDeleted)} lines changed`,
    `${chalk.gray('Gas spent:')} ${config.stats.totalGasSpent || '0'} wei`,
    `${chalk.gray('Pending:')}   ${pendingLogs.length > 0 ? chalk.yellow(String(pendingLogs.length) + ' logs since last checkpoint') : chalk.green('All checkpointed')}`,
  ]));
  console.log();

  // Recent Activity
  if (allLogs.length > 0) {
    const recent = allLogs.slice(-5).reverse();
    const activityLines = recent.map(log => {
      const time = chalk.gray(timeAgo(log.timestamp));
      const msg = log.message.length > 30 ? log.message.substring(0, 30) + '...' : log.message;
      return `${time.padEnd(20)} ${msg}`;
    });
    console.log(box('RECENT ACTIVITY', activityLines));
    console.log();
  }

  // Checkpoint History
  if (allCheckpoints.length > 0) {
    const cpLines = allCheckpoints.map((cp, i) => {
      const idx = chalk.hex('#f0b90b')(`#${i + 1}`);
      const summary = cp.summary.length > 25 ? cp.summary.substring(0, 25) + '...' : cp.summary;
      const time = chalk.gray(timeAgo(cp.timestamp));
      return `${idx} ${summary.padEnd(28)} ${time}`;
    });
    console.log(box('CHECKPOINTS', cpLines));
    console.log();
  }

  // Achievements
  const badges: string[] = [];
  if (allLogs.length >= 1)   badges.push('First Log');
  if (allLogs.length >= 10)  badges.push('Prolific (10+)');
  if (allLogs.length >= 50)  badges.push('Machine (50+)');
  if (allCheckpoints.length >= 1) badges.push('Onchain');
  if (allCheckpoints.length >= 5) badges.push('Chain Master');
  if (totalAdded >= 1000) badges.push('1K Lines');
  if (totalAdded >= 5000) badges.push('5K Lines');

  if (badges.length > 0) {
    const badgeStr = badges.map(b => chalk.hex('#f0b90b')(`[${b}]`)).join(' ');
    console.log(`  ${badgeStr}\n`);
  }

  // Tips
  if (pendingLogs.length >= 3) {
    console.log(chalk.yellow(`  💡 ${pendingLogs.length} pending logs. Run ${chalk.bold('vibe checkpoint "summary"')} to save onchain.`));
  } else if (allLogs.length === 0) {
    console.log(chalk.gray(`  💡 Start building! Run ${chalk.bold('vibe log "your message"')} to add your first entry.`));
  }
}
