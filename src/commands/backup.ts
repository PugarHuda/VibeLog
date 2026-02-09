import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { BackupService } from '../services/BackupService.js';

export async function backupCreateCommand(): Promise<void> {
  const spinner = ora('Creating backup...').start();
  const backupService = new BackupService();

  try {
    const backupFile = backupService.createBackup();
    spinner.succeed(chalk.green('✓ Backup created successfully!'));
    console.log(chalk.gray(`  File: ${backupFile}`));
  } catch (error) {
    spinner.fail(chalk.red(`✗ Backup failed: ${error}`));
    process.exit(1);
  }
}

export async function backupListCommand(): Promise<void> {
  const backupService = new BackupService();
  const backups = backupService.listBackups();

  if (backups.length === 0) {
    console.log(chalk.yellow('No backups found'));
    return;
  }

  console.log(chalk.bold('\n💾 Available Backups\n'));

  for (const backup of backups) {
    const date = new Date(backup.timestamp).toLocaleString();
    console.log(chalk.cyan(`Backup from ${date}`));
    console.log(chalk.gray(`  Hash: ${backup.hash}`));
    console.log(chalk.gray(`  Logs: ${backup.logsCount}`));
    console.log(chalk.gray(`  Checkpoints: ${backup.checkpointsCount}`));
    console.log();
  }
}

export async function backupRestoreCommand(timestamp?: number): Promise<void> {
  const backupService = new BackupService();
  const backups = backupService.listBackups();

  if (backups.length === 0) {
    console.log(chalk.yellow('No backups available'));
    return;
  }

  let selectedTimestamp = timestamp;

  if (!selectedTimestamp) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select backup to restore:',
        choices: backups.map(b => ({
          name: `${new Date(b.timestamp).toLocaleString()} (${b.logsCount} logs, ${b.checkpointsCount} checkpoints)`,
          value: b.timestamp,
        })),
      },
    ]);

    selectedTimestamp = selected;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow('⚠️  This will overwrite current data. Continue?'),
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray('Restore cancelled'));
    return;
  }

  const spinner = ora('Restoring backup...').start();

  try {
    backupService.restoreBackup(selectedTimestamp!);
    spinner.succeed(chalk.green('✓ Backup restored successfully!'));
  } catch (error) {
    spinner.fail(chalk.red(`✗ Restore failed: ${error}`));
    process.exit(1);
  }
}
