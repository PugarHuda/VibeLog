import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getVibelogDir } from '../utils/config.js';

export interface NotificationConfig {
  enabled: boolean;
  reminders: {
    daily?: { enabled: boolean; time: string };
    milestone?: { enabled: boolean; every: number };
    streak?: { enabled: boolean };
  };
  lastNotification?: number;
}

export interface Reminder {
  type: 'daily' | 'milestone' | 'streak';
  message: string;
  timestamp: number;
}

export class NotificationService {
  private configPath: string;

  constructor() {
    this.configPath = join(getVibelogDir(), 'notifications.json');
  }

  private loadConfig(): NotificationConfig {
    if (!existsSync(this.configPath)) {
      return {
        enabled: false,
        reminders: {},
      };
    }
    try {
      const raw = readFileSync(this.configPath, 'utf-8');
      return JSON.parse(raw) as NotificationConfig;
    } catch {
      return {
        enabled: false,
        reminders: {},
      };
    }
  }

  private saveConfig(config: NotificationConfig): void {
    writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  enableDailyReminder(time: string = '18:00'): void {
    const config = this.loadConfig();
    config.enabled = true;
    config.reminders.daily = { enabled: true, time };
    this.saveConfig(config);
  }

  enableMilestoneReminder(every: number = 10): void {
    const config = this.loadConfig();
    config.enabled = true;
    config.reminders.milestone = { enabled: true, every };
    this.saveConfig(config);
  }

  enableStreakReminder(): void {
    const config = this.loadConfig();
    config.enabled = true;
    config.reminders.streak = { enabled: true };
    this.saveConfig(config);
  }

  disableReminders(): void {
    const config = this.loadConfig();
    config.enabled = false;
    this.saveConfig(config);
  }

  getConfig(): NotificationConfig {
    return this.loadConfig();
  }

  shouldNotifyDaily(): boolean {
    const config = this.loadConfig();
    if (!config.enabled || !config.reminders.daily?.enabled) return false;

    const now = new Date();
    const [hours, minutes] = config.reminders.daily.time.split(':').map(Number);
    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);

    const lastNotif = config.lastNotification || 0;
    const hoursSinceLastNotif = (Date.now() - lastNotif * 1000) / (1000 * 60 * 60);

    return now >= targetTime && hoursSinceLastNotif >= 23;
  }

  shouldNotifyMilestone(currentCount: number): boolean {
    const config = this.loadConfig();
    if (!config.enabled || !config.reminders.milestone?.enabled) return false;

    const every = config.reminders.milestone.every;
    return currentCount > 0 && currentCount % every === 0;
  }

  markNotified(): void {
    const config = this.loadConfig();
    config.lastNotification = Math.floor(Date.now() / 1000);
    this.saveConfig(config);
  }

  generateReminderMessage(type: 'daily' | 'milestone' | 'streak', data?: any): string {
    switch (type) {
      case 'daily':
        return '⏰ Daily reminder: Don\'t forget to create a checkpoint for today\'s work!';
      case 'milestone':
        return `🎉 Milestone reached! You've created ${data.count} checkpoints. Keep building!`;
      case 'streak':
        return `🔥 ${data.days} day streak! You're on fire. Create a checkpoint to keep it going!`;
      default:
        return 'Time to create a checkpoint!';
    }
  }
}
