import chalk from 'chalk';
import { isInitialized } from '../utils/config.js';
import { LogManager } from '../services/LogManager.js';

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export async function timelineCommand(): Promise<void> {
  if (!isInitialized()) {
    console.log(chalk.red('❌ VibeLog not initialized. Run `vibe init` first.'));
    process.exit(1);
  }

  const logManager = new LogManager();
  const allLogs = logManager.getAllLogs();
  const allCheckpoints = logManager.getAllCheckpoints();

  if (allLogs.length === 0) {
    console.log(chalk.gray('\n  No activity yet. Run `vibe log "message"` to start.\n'));
    return;
  }

  // Merge logs and checkpoints into a unified timeline
  interface TimelineEvent {
    type: 'log' | 'checkpoint';
    timestamp: number;
    message: string;
    meta?: string;
  }

  const events: TimelineEvent[] = [];

  for (const log of allLogs) {
    const diffStr = log.diff
      ? chalk.green(`+${log.diff.linesAdded}`) + chalk.red(`-${log.diff.linesDeleted}`)
      : '';
    events.push({
      type: 'log',
      timestamp: log.timestamp,
      message: log.message,
      meta: diffStr,
    });
  }

  for (const cp of allCheckpoints) {
    events.push({
      type: 'checkpoint',
      timestamp: cp.timestamp,
      message: cp.summary,
      meta: `${cp.logs.length} logs | ${cp.blockchain.txHash.substring(0, 10)}...`,
    });
  }

  events.sort((a, b) => a.timestamp - b.timestamp);

  // Group by day
  const days = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    const dayKey = formatDate(ev.timestamp);
    if (!days.has(dayKey)) days.set(dayKey, []);
    days.get(dayKey)!.push(ev);
  }

  console.log(chalk.hex('#f0b90b').bold('\n  BUILD TIMELINE\n'));

  for (const [day, dayEvents] of days) {
    console.log(chalk.white.bold(`  ${day}`));
    console.log(chalk.gray('  │'));

    for (let i = 0; i < dayEvents.length; i++) {
      const ev = dayEvents[i];
      const isLast = i === dayEvents.length - 1;
      const connector = isLast ? '└' : '├';
      const time = formatTime(ev.timestamp);

      if (ev.type === 'checkpoint') {
        console.log(chalk.gray(`  ${connector}─`) + chalk.hex('#f0b90b')('◆') + chalk.gray(` ${time} `) + chalk.hex('#f0b90b').bold('CHECKPOINT') + chalk.gray(` ${ev.message}`));
        if (ev.meta) {
          const pad = isLast ? ' ' : '│';
          console.log(chalk.gray(`  ${pad}       ${ev.meta}`));
        }
      } else {
        const msg = ev.message.length > 50 ? ev.message.substring(0, 50) + '...' : ev.message;
        console.log(chalk.gray(`  ${connector}─`) + chalk.cyan('●') + chalk.gray(` ${time} `) + chalk.white(msg) + (ev.meta ? ` ${ev.meta}` : ''));
      }
    }
    console.log();
  }

  // Stats bar
  const duration = events[events.length - 1].timestamp - events[0].timestamp;
  const hours = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  console.log(chalk.gray(`  ─── ${allLogs.length} logs · ${allCheckpoints.length} checkpoints · span: ${durationStr} ───\n`));
}
