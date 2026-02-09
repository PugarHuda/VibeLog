import chalk from 'chalk';
import { AnalyticsService } from '../services/AnalyticsService.js';

export async function analyticsCommand(): Promise<void> {
  const analytics = new AnalyticsService();

  console.log(chalk.bold('\n📊 Analytics Dashboard\n'));

  const patterns = await analytics.getCodingPatterns();
  const velocity = await analytics.getVelocityMetrics();
  const quality = analytics.getCodeQualityMetrics();

  console.log(chalk.bold.cyan('⏰ Coding Patterns'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Most productive hour: ${chalk.yellow(patterns.mostProductiveHour + ':00')}`);
  console.log(`Most productive day: ${chalk.yellow(patterns.mostProductiveDay)}`);
  
  if (patterns.frameworksUsed.length > 0) {
    console.log(`Frameworks: ${chalk.yellow(patterns.frameworksUsed.join(', '))}`);
  }

  console.log('\nHourly Activity:');
  const maxActivity = Math.max(...Object.values(patterns.hourlyActivity));
  for (let hour = 0; hour < 24; hour++) {
    const count = patterns.hourlyActivity[hour] || 0;
    const bar = '█'.repeat(Math.ceil((count / maxActivity) * 20));
    console.log(`  ${String(hour).padStart(2, '0')}:00 ${chalk.cyan(bar)} ${count}`);
  }

  console.log(chalk.bold.cyan('\n🚀 Velocity Metrics'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Total commits: ${chalk.yellow(velocity.totalCommits)}`);
  console.log(`Total lines changed: ${chalk.yellow(velocity.totalLines.toLocaleString())}`);
  console.log(`Avg lines/day: ${chalk.yellow(velocity.avgLinesPerDay)}`);
  console.log(`Avg commits/week: ${chalk.yellow(velocity.avgCommitsPerWeek)}`);
  console.log(`Longest streak: ${chalk.yellow(velocity.longestStreak)} days`);
  console.log(`Current streak: ${chalk.yellow(velocity.currentStreak)} days ${velocity.currentStreak > 0 ? '🔥' : ''}`);

  console.log(chalk.bold.cyan('\n✨ Code Quality'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`Avg files per commit: ${chalk.yellow(quality.avgFilesPerCommit)}`);
  console.log(`Largest commit: ${chalk.yellow(quality.largestCommit.lines)} lines (${quality.largestCommit.date})`);
  console.log(`Smallest commit: ${chalk.yellow(quality.smallestCommit.lines)} lines (${quality.smallestCommit.date})`);
  console.log(`Commit frequency: ${chalk.yellow(quality.commitFrequency)}`);

  if (Object.keys(patterns.languageStats).length > 0) {
    console.log(chalk.bold.cyan('\n📝 Language Stats'));
    console.log(chalk.gray('─'.repeat(50)));
    const sorted = Object.entries(patterns.languageStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    for (const [lang, count] of sorted) {
      console.log(`  ${lang.padEnd(15)} ${chalk.cyan('█'.repeat(Math.ceil(count / 5)))} ${count}`);
    }
  }

  console.log();
}

export async function analyticsExportCommand(format: 'json' | 'csv' = 'json'): Promise<void> {
  const analytics = new AnalyticsService();
  
  const patterns = await analytics.getCodingPatterns();
  const velocity = await analytics.getVelocityMetrics();
  const quality = analytics.getCodeQualityMetrics();

  const data = {
    patterns,
    velocity,
    quality,
    exportedAt: new Date().toISOString(),
  };

  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('timestamp,metric,value');
    console.log(`${data.exportedAt},total_commits,${velocity.totalCommits}`);
    console.log(`${data.exportedAt},total_lines,${velocity.totalLines}`);
    console.log(`${data.exportedAt},avg_lines_per_day,${velocity.avgLinesPerDay}`);
    console.log(`${data.exportedAt},longest_streak,${velocity.longestStreak}`);
    console.log(`${data.exportedAt},current_streak,${velocity.currentStreak}`);
  }
}
