import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { isInitialized, loadConfig } from '../utils/config.js';
import { LogManager } from '../services/LogManager.js';
import { ReportGenerator } from '../services/ReportGenerator.js';
import { AISummarizer } from '../services/AISummarizer.js';

export async function exportCommand(options: { output?: string; name?: string; json?: boolean }): Promise<void> {
  if (!isInitialized()) {
    console.log(chalk.red('❌ VibeLog not initialized. Run `vibe init` first.'));
    process.exit(1);
  }

  const spinner = ora('Generating BUILD_LOG.md...').start();

  try {
    const config = loadConfig();
    const logManager = new LogManager();
    const generator = new ReportGenerator();

    const logs = logManager.getAllLogs();
    const checkpoints = logManager.getAllCheckpoints();

    if (logs.length === 0) {
      spinner.warn('No logs found.');
      console.log(chalk.gray('   Add logs first with: vibe log "your message"'));
      return;
    }

    spinner.text = `Analyzing ${logs.length} log entries...`;

    // AI enhance if available
    let reflection: string | undefined;
    if (config.ai.enabled) {
      spinner.text = 'AI enhancing narratives...';
      const ai = new AISummarizer();
      if (ai.isAvailable()) {
        reflection = await ai.enhanceBuildLog(logs, options.name || 'My Project');
      }
    }

    spinner.text = 'Writing markdown...';

    const markdown = generator.generate(logs, checkpoints, {
      projectName: options.name,
      reflection,
    });

    // Stats
    const totalAdded = logs.reduce((s, l) => s + (l.diff?.linesAdded || 0), 0);
    const totalDeleted = logs.reduce((s, l) => s + (l.diff?.linesDeleted || 0), 0);

    const outputPath = join(process.cwd(), options.output || 'BUILD_LOG.md');
    writeFileSync(outputPath, markdown);

    // JSON export
    if (options.json) {
      const jsonData = {
        project: options.name || 'My Project',
        builder: config.wallet.address,
        network: config.network.name,
        generated: new Date().toISOString(),
        stats: {
          totalLogs: logs.length,
          totalCheckpoints: checkpoints.length,
          linesAdded: totalAdded,
          linesDeleted: totalDeleted,
        },
        logs: logs.map(l => ({
          id: l.id,
          timestamp: l.timestamp,
          date: new Date(l.timestamp * 1000).toISOString(),
          message: l.message,
          commit: l.commit,
          diff: l.diff,
          aiTool: l.aiContext?.tool,
          aiSummary: l.aiSummary,
        })),
        checkpoints: checkpoints.map(cp => ({
          id: cp.id,
          timestamp: cp.timestamp,
          date: new Date(cp.timestamp * 1000).toISOString(),
          summary: cp.summary,
          logHash: cp.logHash,
          logsIncluded: cp.logs.length,
          txHash: cp.blockchain.txHash,
          blockNumber: cp.blockchain.blockNumber,
        })),
      };
      const jsonPath = outputPath.replace(/\.md$/, '.json');
      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    }

    const fileSizeKb = (Buffer.byteLength(markdown) / 1024).toFixed(1);
    spinner.succeed(`BUILD_LOG.md created (${fileSizeKb} KB)${options.json ? ' + JSON' : ''}`);

    console.log(chalk.green('\n🎬 Ready for hackathon submission!\n'));
    console.log(chalk.cyan('Preview:'));
    console.log(chalk.gray(`   • ${logs.length} build sessions documented`));
    console.log(chalk.gray(`   • ${checkpoints.length} onchain proofs included`));
    console.log(chalk.gray(`   • +${totalAdded}/-${totalDeleted} lines of code`));
    if (reflection) {
      console.log(chalk.gray(`   • AI-enhanced narrative included`));
    }

    console.log(chalk.gray(`\nNext: Copy BUILD_LOG.md to your project README`));
  } catch (error: any) {
    spinner.fail('Failed to generate report');
    console.log(chalk.red(`   Error: ${error.message}`));
    process.exit(1);
  }
}
