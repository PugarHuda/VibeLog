import chalk from 'chalk';
import ora from 'ora';
import { isInitialized, loadConfig } from '../utils/config.js';
import { GitService } from '../services/GitService.js';
import { LogManager } from '../services/LogManager.js';
import { AISummarizer } from '../services/AISummarizer.js';

export async function logCommand(message: string, options: { tool?: string; prompt?: string; auto?: boolean }): Promise<void> {
  if (!isInitialized()) {
    console.log(chalk.red('❌ VibeLog not initialized. Run `vibe init` first.'));
    process.exit(1);
  }

  const spinner = ora('Processing log entry...').start();

  try {
    const git = new GitService();
    const logManager = new LogManager();
    const config = loadConfig();

    // Get git info
    const commit = await git.getLatestCommit();
    const diff = await git.getDiffStats();

    if (commit) {
      spinner.text = 'Detected git changes...';
    }

    // AI summary (optional, skip in auto mode)
    let aiSummary: string | undefined;
    if (config.ai.enabled && !options.auto) {
      spinner.text = 'Generating AI summary...';
      const ai = new AISummarizer();
      if (ai.isAvailable()) {
        const tempEntry = {
          id: 'temp',
          timestamp: Date.now(),
          message,
          commit: commit || undefined,
          diff: diff || undefined,
        };
        aiSummary = await ai.summarizeLog(tempEntry);
      }
    }

    // Create entry
    const entry = await logManager.createEntry({
      message,
      commit: commit || undefined,
      diff: diff || undefined,
      aiContext: options.tool || options.prompt
        ? { tool: options.tool, prompt: options.prompt }
        : undefined,
      aiSummary,
    });

    spinner.succeed('Log entry saved!');

    // Display details
    if (diff) {
      console.log(chalk.blue('\n📊 Detected changes:'));
      if (diff.files.length > 0) {
        console.log(chalk.gray(`   • Files: ${diff.files.slice(0, 3).join(', ')}${diff.files.length > 3 ? ` (+${diff.files.length - 3} more)` : ''}`));
      }
      console.log(chalk.gray(`   • Changes: +${diff.linesAdded} lines, -${diff.linesDeleted} lines`));
    }

    if (commit) {
      console.log(chalk.gray(`   • Commit: ${commit.hash} "${commit.message}"`));
    }

    console.log(chalk.green(`\n✅ Log entry #${config.stats.totalLogs + 1} saved!`));
    console.log(chalk.gray(`   ID: ${entry.id}`));
    console.log(
      chalk.gray(
        `   Timestamp: ${new Date(entry.timestamp * 1000).toISOString().replace('T', ' ').substring(0, 19)} UTC`
      )
    );

    if (aiSummary) {
      console.log(chalk.cyan(`\n🤖 AI Summary: ${aiSummary}`));
    }

    // Tip
    const pendingLogs = logManager.getLogsSinceCheckpoint();
    if (pendingLogs.length >= 3) {
      console.log(
        chalk.yellow(
          `\n💡 Tip: Run 'vibe checkpoint' to save onchain (${pendingLogs.length} logs since last checkpoint)`
        )
      );
    }
  } catch (error: any) {
    spinner.fail('Failed to create log entry');
    console.log(chalk.red(`   Error: ${error.message}`));
    process.exit(1);
  }
}
