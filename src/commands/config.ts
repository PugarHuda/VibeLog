import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadConfig, saveConfig } from '../utils/config.js';
import { NotificationService } from '../services/NotificationService.js';

export async function configCommand(): Promise<void> {
  const config = loadConfig();

  console.log(chalk.bold('\n⚙️  Configuration\n'));
  console.log(chalk.gray('Network:'), chalk.cyan(config.network.name));
  console.log(chalk.gray('Wallet:'), chalk.cyan(config.wallet.address));
  console.log(chalk.gray('AI Provider:'), chalk.cyan(config.ai.provider));
  console.log(chalk.gray('AI Enabled:'), config.ai.enabled ? chalk.green('Yes') : chalk.red('No'));
  console.log();
}

export async function configSetCommand(key: string, value: string): Promise<void> {
  const config = loadConfig();

  const validKeys = ['ai.enabled', 'ai.provider'];
  
  if (!validKeys.includes(key)) {
    console.log(chalk.red(`✗ Invalid config key: ${key}`));
    console.log(chalk.gray(`Valid keys: ${validKeys.join(', ')}`));
    process.exit(1);
  }

  if (key === 'ai.enabled') {
    config.ai.enabled = value === 'true';
  } else if (key === 'ai.provider') {
    if (value !== 'gemini' && value !== 'none') {
      console.log(chalk.red('✗ Invalid AI provider. Use: gemini, none'));
      process.exit(1);
    }
    config.ai.provider = value as 'gemini' | 'none';
  }

  saveConfig(config);
  console.log(chalk.green(`✓ Config updated: ${key} = ${value}`));
}

export async function configRemindCommand(): Promise<void> {
  const notificationService = new NotificationService();

  const { reminderType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'reminderType',
      message: 'Select reminder type:',
      choices: [
        { name: 'Daily checkpoint reminder', value: 'daily' },
        { name: 'Milestone reminder (every N checkpoints)', value: 'milestone' },
        { name: 'Streak reminder', value: 'streak' },
        { name: 'Disable all reminders', value: 'disable' },
      ],
    },
  ]);

  if (reminderType === 'disable') {
    notificationService.disableReminders();
    console.log(chalk.green('✓ Reminders disabled'));
    return;
  }

  if (reminderType === 'daily') {
    const { time } = await inquirer.prompt([
      {
        type: 'input',
        name: 'time',
        message: 'Reminder time (HH:MM):',
        default: '18:00',
        validate: (input) => /^\d{2}:\d{2}$/.test(input) || 'Invalid time format',
      },
    ]);

    notificationService.enableDailyReminder(time);
    console.log(chalk.green(`✓ Daily reminder set for ${time}`));
  } else if (reminderType === 'milestone') {
    const { every } = await inquirer.prompt([
      {
        type: 'number',
        name: 'every',
        message: 'Remind every N checkpoints:',
        default: 10,
        validate: (input) => input > 0 || 'Must be greater than 0',
      },
    ]);

    notificationService.enableMilestoneReminder(every);
    console.log(chalk.green(`✓ Milestone reminder set (every ${every} checkpoints)`));
  } else if (reminderType === 'streak') {
    notificationService.enableStreakReminder();
    console.log(chalk.green('✓ Streak reminder enabled'));
  }
}
