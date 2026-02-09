#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { initCommand } from './commands/init.js';
import { logCommand } from './commands/log.js';
import { checkpointCommand } from './commands/checkpoint.js';
import { exportCommand } from './commands/export.js';
import { verifyCommand } from './commands/verify.js';
import { statusCommand } from './commands/status.js';
import { timelineCommand } from './commands/timeline.js';
import { hooksInstallCommand, hooksRemoveCommand } from './commands/hooks.js';

dotenv.config();

const program = new Command();

program
  .name('vibe')
  .description('VibeLog - Auto-generate verified AI build logs with onchain proof on BNB Chain.\n\nTrack your hackathon build sessions, create tamper-proof checkpoints on BSC,\nand export beautiful build narratives with AI summaries.')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize VibeLog in current project')
  .action(async () => {
    await initCommand();
  });

program
  .command('log <message>')
  .description('Add a build log entry')
  .option('-t, --tool <tool>', 'AI tool used (e.g., "Claude", "Cursor")')
  .option('-p, --prompt <prompt>', 'AI prompt used')
  .option('--auto', 'Non-interactive mode (skip AI summary, fast)')
  .action(async (message: string, options: { tool?: string; prompt?: string; auto?: boolean }) => {
    await logCommand(message, options);
  });

program
  .command('checkpoint <summary>')
  .description('Create an onchain checkpoint')
  .option('--dry-run', 'Estimate gas cost without submitting')
  .action(async (summary: string, options: { dryRun?: boolean }) => {
    await checkpointCommand(summary, options);
  });

program
  .command('export')
  .description('Generate BUILD_LOG.md report')
  .option('-o, --output <file>', 'Output file path', 'BUILD_LOG.md')
  .option('-n, --name <name>', 'Project name')
  .option('--json', 'Also export structured JSON data')
  .action(async (options: { output?: string; name?: string; json?: boolean }) => {
    await exportCommand(options);
  });

program
  .command('verify [file]')
  .description('Verify BUILD_LOG.md against blockchain')
  .action(async (file?: string) => {
    await verifyCommand(file);
  });

program
  .command('status')
  .description('Show project dashboard with stats and activity')
  .action(async () => {
    await statusCommand();
  });

program
  .command('timeline')
  .description('Show visual build timeline')
  .action(async () => {
    await timelineCommand();
  });

const hooks = program
  .command('hooks')
  .description('Manage git hooks for auto-logging');

hooks
  .command('install')
  .description('Install post-commit hook for automatic logging')
  .action(async () => {
    await hooksInstallCommand();
  });

hooks
  .command('remove')
  .description('Remove VibeLog post-commit hook')
  .action(async () => {
    await hooksRemoveCommand();
  });

program.parse();
