import chalk from 'chalk';
import ora from 'ora';
import { LogManager } from '../services/LogManager.js';
import { CodeQualityService } from '../services/CodeQualityService.js';

export async function qualityCommand(logId?: string): Promise<void> {
  const logManager = new LogManager();
  const qualityService = new CodeQualityService();

  let logs = logManager.getAllLogs();

  if (logs.length === 0) {
    console.log(chalk.yellow('No logs found'));
    return;
  }

  // Analyze specific log or latest
  const targetLog = logId 
    ? logs.find(l => l.id === logId)
    : logs[logs.length - 1];

  if (!targetLog) {
    console.log(chalk.red('Log not found'));
    return;
  }

  const spinner = ora('Analyzing code quality...').start();

  try {
    const report = await qualityService.analyzeLog(targetLog);
    spinner.succeed('Analysis complete');

    console.log(chalk.bold('\n📊 Code Quality Report\n'));
    
    // Score
    const scoreColor = report.score >= 80 ? chalk.green : report.score >= 60 ? chalk.yellow : chalk.red;
    console.log(`${chalk.bold('Quality Score:')} ${scoreColor(report.score + '/100')}`);
    
    // Summary
    console.log(chalk.bold('\n📝 Summary:'));
    console.log(chalk.gray(report.summary));

    // Issues
    if (report.issues.length > 0) {
      console.log(chalk.bold('\n⚠️  Issues Found:\n'));

      for (const issue of report.issues) {
        const severityColor = issue.severity === 'high' ? chalk.red : 
                             issue.severity === 'medium' ? chalk.yellow : chalk.gray;
        const icon = issue.severity === 'high' ? '🔴' : 
                    issue.severity === 'medium' ? '🟡' : '⚪';

        console.log(`${icon} ${severityColor(issue.severity.toUpperCase())} - ${issue.type}`);
        console.log(chalk.gray(`   ${issue.message}`));
        if (issue.file) {
          console.log(chalk.gray(`   File: ${issue.file}`));
        }
        if (issue.suggestion) {
          console.log(chalk.cyan(`   💡 ${issue.suggestion}`));
        }
        console.log();
      }
    } else {
      console.log(chalk.green('\n✓ No issues found!'));
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(chalk.bold('💡 Recommendations:\n'));
      for (const rec of report.recommendations) {
        console.log(chalk.cyan(`  • ${rec}`));
      }
    }

    // Log details
    console.log(chalk.bold('\n📄 Log Details:\n'));
    console.log(chalk.gray(`  Message: ${targetLog.message}`));
    if (targetLog.commit) {
      console.log(chalk.gray(`  Commit: ${targetLog.commit.hash} - ${targetLog.commit.message}`));
    }
    if (targetLog.diff) {
      console.log(chalk.gray(`  Changes: +${targetLog.diff.linesAdded}/-${targetLog.diff.linesDeleted} lines, ${targetLog.diff.filesChanged} files`));
    }

    // Categories
    const categories = await qualityService.categorizeLog(targetLog);
    if (categories.length > 0) {
      console.log(chalk.gray(`  Categories: ${categories.join(', ')}`));
    }

  } catch (error) {
    spinner.fail('Analysis failed');
    console.log(chalk.red(`Error: ${error}`));
  }
}

export async function qualityAllCommand(): Promise<void> {
  const logManager = new LogManager();
  const qualityService = new CodeQualityService();

  const logs = logManager.getAllLogs();

  if (logs.length === 0) {
    console.log(chalk.yellow('No logs found'));
    return;
  }

  console.log(chalk.bold(`\n📊 Analyzing ${logs.length} logs...\n`));

  let totalScore = 0;
  let highIssues = 0;
  let mediumIssues = 0;
  let lowIssues = 0;

  const spinner = ora('Analyzing...').start();

  for (let i = 0; i < logs.length; i++) {
    spinner.text = `Analyzing log ${i + 1}/${logs.length}...`;
    
    try {
      const report = await qualityService.analyzeLog(logs[i]);
      totalScore += report.score;

      for (const issue of report.issues) {
        if (issue.severity === 'high') highIssues++;
        else if (issue.severity === 'medium') mediumIssues++;
        else lowIssues++;
      }
    } catch {
      // Skip failed analyses
    }
  }

  spinner.succeed('Analysis complete');

  const avgScore = Math.round(totalScore / logs.length);
  const scoreColor = avgScore >= 80 ? chalk.green : avgScore >= 60 ? chalk.yellow : chalk.red;

  console.log(chalk.bold('\n📈 Overall Quality Report\n'));
  console.log(`${chalk.bold('Average Score:')} ${scoreColor(avgScore + '/100')}`);
  console.log(chalk.gray(`Based on ${logs.length} logs`));

  console.log(chalk.bold('\n⚠️  Issues Summary:\n'));
  console.log(`  ${chalk.red('High:')} ${highIssues}`);
  console.log(`  ${chalk.yellow('Medium:')} ${mediumIssues}`);
  console.log(`  ${chalk.gray('Low:')} ${lowIssues}`);
  console.log(`  ${chalk.bold('Total:')} ${highIssues + mediumIssues + lowIssues}`);

  if (avgScore >= 80) {
    console.log(chalk.green('\n✨ Excellent code quality! Keep it up!'));
  } else if (avgScore >= 60) {
    console.log(chalk.yellow('\n👍 Good code quality. Some room for improvement.'));
  } else {
    console.log(chalk.red('\n⚠️  Code quality needs attention. Review the issues above.'));
  }
}
