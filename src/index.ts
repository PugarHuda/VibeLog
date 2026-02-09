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
import { backupCreateCommand, backupListCommand, backupRestoreCommand } from './commands/backup.js';
import { syncCommand, syncStatusCommand } from './commands/sync.js';
import { configCommand, configSetCommand, configRemindCommand } from './commands/config.js';
import { githubConnectCommand, githubDisconnectCommand, githubSyncCommand, githubBadgeCommand, githubStatusCommand } from './commands/github.js';
import { teamAddCommand, teamListCommand, teamRemoveCommand } from './commands/team.js';
import { analyticsCommand, analyticsExportCommand } from './commands/analytics.js';
import { qrCommand } from './commands/qr.js';
import { qualityCommand, qualityAllCommand } from './commands/quality.js';
import { gasCommand, gasWaitCommand } from './commands/gas.js';

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
  .option('-f, --format <format>', 'Export format: markdown, html, json, csv', 'markdown')
  .option('--template <template>', 'Template: default, hackathon, client, grant', 'default')
  .action(async (options: { output?: string; name?: string; json?: boolean; format?: string; template?: string }) => {
    await exportCommand(options as any);
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

// Backup commands
const backup = program
  .command('backup')
  .description('Manage backups');

backup
  .command('create')
  .description('Create a backup of all VibeLog data')
  .action(async () => {
    await backupCreateCommand();
  });

backup
  .command('list')
  .description('List all available backups')
  .action(async () => {
    await backupListCommand();
  });

backup
  .command('restore [timestamp]')
  .description('Restore from a backup')
  .action(async (timestamp?: string) => {
    await backupRestoreCommand(timestamp ? parseInt(timestamp) : undefined);
  });

// Sync commands
program
  .command('sync')
  .description('Sync pending offline checkpoints to blockchain')
  .action(async () => {
    await syncCommand();
  });

program
  .command('queue')
  .description('Show offline checkpoint queue status')
  .action(async () => {
    await syncStatusCommand();
  });

// Config commands
const config = program
  .command('config')
  .description('Manage configuration');

config
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    await configCommand();
  });

config
  .command('set <key> <value>')
  .description('Set configuration value')
  .action(async (key: string, value: string) => {
    await configSetCommand(key, value);
  });

config
  .command('remind')
  .description('Configure reminders')
  .action(async () => {
    await configRemindCommand();
  });

// GitHub commands
const github = program
  .command('github')
  .description('GitHub integration');

github
  .command('connect')
  .description('Connect to GitHub repository')
  .action(async () => {
    await githubConnectCommand();
  });

github
  .command('disconnect')
  .description('Disconnect from GitHub')
  .action(async () => {
    await githubDisconnectCommand();
  });

github
  .command('sync')
  .description('Sync with GitHub releases')
  .action(async () => {
    await githubSyncCommand();
  });

github
  .command('badge')
  .description('Generate VibeLog badge for README')
  .action(async () => {
    await githubBadgeCommand();
  });

github
  .command('status')
  .description('Show GitHub connection status')
  .action(async () => {
    await githubStatusCommand();
  });

// Team commands
const team = program
  .command('team')
  .description('Manage team members');

team
  .command('add [address]')
  .description('Add a team member')
  .action(async (address?: string) => {
    await teamAddCommand(address);
  });

team
  .command('list')
  .description('List all team members')
  .action(async () => {
    await teamListCommand();
  });

team
  .command('remove [address]')
  .description('Remove a team member')
  .action(async (address?: string) => {
    await teamRemoveCommand(address);
  });

// Analytics commands
program
  .command('analytics')
  .description('Show coding analytics and patterns')
  .option('--export <format>', 'Export analytics (json or csv)')
  .action(async (options: { export?: 'json' | 'csv' }) => {
    if (options.export) {
      await analyticsExportCommand(options.export);
    } else {
      await analyticsCommand();
    }
  });

// Shortcuts
program
  .command('l <message>')
  .description('Shortcut for log')
  .option('-t, --tool <tool>', 'AI tool used')
  .option('-p, --prompt <prompt>', 'AI prompt used')
  .option('--auto', 'Non-interactive mode')
  .action(async (message: string, options: any) => {
    await logCommand(message, options);
  });

program
  .command('c <summary>')
  .description('Shortcut for checkpoint')
  .option('--dry-run', 'Estimate gas cost without submitting')
  .action(async (summary: string, options: any) => {
    await checkpointCommand(summary, options);
  });

program
  .command('s')
  .description('Shortcut for status')
  .action(async () => {
    await statusCommand();
  });

// QR Code command
program
  .command('qr [checkpoint]')
  .description('Generate QR code for verification')
  .action(async (checkpoint?: string) => {
    await qrCommand(checkpoint ? parseInt(checkpoint) : undefined);
  });

// Code Quality commands
const quality = program
  .command('quality')
  .description('Analyze code quality');

quality
  .command('check [logId]')
  .description('Check quality of specific log (or latest)')
  .action(async (logId?: string) => {
    await qualityCommand(logId);
  });

quality
  .command('all')
  .description('Analyze quality of all logs')
  .action(async () => {
    await qualityAllCommand();
  });

// Gas commands
const gas = program
  .command('gas')
  .description('Gas price monitoring and optimization');

gas
  .command('check')
  .description('Check current BSC gas prices')
  .action(async () => {
    await gasCommand();
  });

gas
  .command('wait [maxGwei]')
  .description('Wait for gas price to drop below threshold')
  .action(async (maxGwei?: string) => {
    await gasWaitCommand(maxGwei ? parseInt(maxGwei) : undefined);
  });

program.parse();
