import { LogManager } from './LogManager.js';
import { GitService } from './GitService.js';
import type { LogEntry } from '../types/index.js';

export interface CodingPattern {
  hourlyActivity: Record<number, number>;
  dailyActivity: Record<string, number>;
  mostProductiveHour: number;
  mostProductiveDay: string;
  languageStats: Record<string, number>;
  frameworksUsed: string[];
}

export interface VelocityMetrics {
  totalCommits: number;
  totalLines: number;
  avgLinesPerDay: number;
  avgCommitsPerWeek: number;
  longestStreak: number;
  currentStreak: number;
}

export interface CodeQualityMetrics {
  avgFilesPerCommit: number;
  largestCommit: { lines: number; date: string };
  smallestCommit: { lines: number; date: string };
  commitFrequency: 'high' | 'medium' | 'low';
}

export class AnalyticsService {
  private logManager: LogManager;
  private gitService: GitService;

  constructor() {
    this.logManager = new LogManager();
    this.gitService = new GitService();
  }

  async getCodingPatterns(): Promise<CodingPattern> {
    const logs = this.logManager.getAllLogs();
    
    const hourlyActivity: Record<number, number> = {};
    const dailyActivity: Record<string, number> = {};
    const languageStats: Record<string, number> = {};

    for (const log of logs) {
      const date = new Date(log.timestamp * 1000);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });

      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;

      if (log.diff?.files) {
        for (const file of log.diff.files) {
          const ext = file.split('.').pop() || 'unknown';
          languageStats[ext] = (languageStats[ext] || 0) + 1;
        }
      }
    }

    const mostProductiveHour = Object.entries(hourlyActivity)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 0;

    const mostProductiveDay = Object.entries(dailyActivity)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';

    const frameworksUsed = await this.gitService.detectFramework();

    return {
      hourlyActivity,
      dailyActivity,
      mostProductiveHour: Number(mostProductiveHour),
      mostProductiveDay,
      languageStats,
      frameworksUsed,
    };
  }

  async getVelocityMetrics(): Promise<VelocityMetrics> {
    const logs = this.logManager.getAllLogs();
    
    const totalCommits = logs.filter(l => l.commit).length;
    const totalLines = logs.reduce((sum, l) => 
      sum + (l.diff?.linesAdded || 0) + (l.diff?.linesDeleted || 0), 0
    );

    const dates = logs.map(l => new Date(l.timestamp * 1000).toDateString());
    const uniqueDays = new Set(dates).size;
    const avgLinesPerDay = uniqueDays > 0 ? Math.round(totalLines / uniqueDays) : 0;

    const weeks = Math.ceil(uniqueDays / 7);
    const avgCommitsPerWeek = weeks > 0 ? Math.round(totalCommits / weeks) : 0;

    const { longestStreak, currentStreak } = this.calculateStreaks(logs);

    return {
      totalCommits,
      totalLines,
      avgLinesPerDay,
      avgCommitsPerWeek,
      longestStreak,
      currentStreak,
    };
  }

  private calculateStreaks(logs: LogEntry[]): { longestStreak: number; currentStreak: number } {
    if (logs.length === 0) return { longestStreak: 0, currentStreak: 0 };

    const dates = logs
      .map(l => new Date(l.timestamp * 1000).toDateString())
      .sort();

    const uniqueDates = Array.from(new Set(dates));
    
    let longestStreak = 1;
    let currentStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    const today = new Date().toDateString();
    const lastDate = uniqueDates[uniqueDates.length - 1];
    const daysSinceLastLog = Math.floor(
      (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    currentStreak = daysSinceLastLog <= 1 ? tempStreak : 0;

    return { longestStreak, currentStreak };
  }

  getCodeQualityMetrics(): CodeQualityMetrics {
    const logs = this.logManager.getAllLogs();
    const commitsWithDiff = logs.filter(l => l.diff);

    if (commitsWithDiff.length === 0) {
      return {
        avgFilesPerCommit: 0,
        largestCommit: { lines: 0, date: 'N/A' },
        smallestCommit: { lines: 0, date: 'N/A' },
        commitFrequency: 'low',
      };
    }

    const avgFilesPerCommit = Math.round(
      commitsWithDiff.reduce((sum, l) => sum + (l.diff?.filesChanged || 0), 0) / 
      commitsWithDiff.length
    );

    const commitSizes = commitsWithDiff.map(l => ({
      lines: (l.diff?.linesAdded || 0) + (l.diff?.linesDeleted || 0),
      date: new Date(l.timestamp * 1000).toLocaleDateString(),
    }));

    const largestCommit = commitSizes.reduce((max, c) => 
      c.lines > max.lines ? c : max, commitSizes[0]
    );

    const smallestCommit = commitSizes.reduce((min, c) => 
      c.lines < min.lines ? c : min, commitSizes[0]
    );

    const frequency = logs.length > 50 ? 'high' : logs.length > 20 ? 'medium' : 'low';

    return {
      avgFilesPerCommit,
      largestCommit,
      smallestCommit,
      commitFrequency: frequency,
    };
  }
}
