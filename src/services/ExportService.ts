import { LogManager } from './LogManager.js';
import { loadConfig } from '../utils/config.js';
import type { LogEntry, Checkpoint } from '../types/index.js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getCheckpointsDir } from '../utils/config.js';

export type ExportFormat = 'markdown' | 'html' | 'pdf' | 'json' | 'csv';
export type ExportTemplate = 'default' | 'hackathon' | 'client' | 'grant';

export class ExportService {
  private logManager: LogManager;

  constructor() {
    this.logManager = new LogManager();
  }

  async exportToFormat(
    format: ExportFormat,
    template: ExportTemplate = 'default',
    options: { projectName?: string; output?: string } = {}
  ): Promise<string> {
    const logs = this.logManager.getAllLogs();
    const checkpoints = this.loadAllCheckpoints();
    const config = loadConfig();

    switch (format) {
      case 'markdown':
        return this.exportMarkdown(logs, checkpoints, config, template, options);
      case 'html':
        return this.exportHTML(logs, checkpoints, config, template, options);
      case 'json':
        return this.exportJSON(logs, checkpoints, config);
      case 'csv':
        return this.exportCSV(logs);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private exportMarkdown(
    logs: LogEntry[],
    checkpoints: Checkpoint[],
    config: any,
    template: ExportTemplate,
    options: any
  ): string {
    const projectName = options.projectName || 'Project';
    
    switch (template) {
      case 'hackathon':
        return this.generateHackathonTemplate(logs, checkpoints, config, projectName);
      case 'client':
        return this.generateClientTemplate(logs, checkpoints, config, projectName);
      case 'grant':
        return this.generateGrantTemplate(logs, checkpoints, config, projectName);
      default:
        return this.generateDefaultTemplate(logs, checkpoints, config, projectName);
    }
  }

  private generateHackathonTemplate(
    logs: LogEntry[],
    checkpoints: Checkpoint[],
    config: any,
    projectName: string
  ): string {
    const totalLines = logs.reduce((sum, l) => 
      sum + (l.diff?.linesAdded || 0) + (l.diff?.linesDeleted || 0), 0
    );

    return `# ${projectName} - Hackathon Build Log

**🏆 Verified Build Journey**

## 📊 Quick Stats

- **Total Build Sessions**: ${logs.length}
- **Onchain Checkpoints**: ${checkpoints.length}
- **Lines of Code**: ${totalLines.toLocaleString()}
- **Builder**: \`${config.wallet.address}\`
- **Network**: ${config.network.name}

## 🔐 Verification

All checkpoints are cryptographically verified on BNB Smart Chain.

[🔍 Verify on VibeLog](https://pugarhuda.github.io/VibeLog/?address=${config.wallet.address})

## 📝 Build Timeline

${this.generateTimelineSection(logs, checkpoints)}

## 🎯 Checkpoints

${this.generateCheckpointsSection(checkpoints, config)}

---

*Generated with [VibeLog](https://github.com/PugarHuda/VibeLog) - Proof of Vibe on BNB Chain*
`;
  }

  private generateClientTemplate(
    logs: LogEntry[],
    checkpoints: Checkpoint[],
    config: any,
    projectName: string
  ): string {
    return `# ${projectName} - Development Report

**Professional Build Documentation**

## Executive Summary

This report provides a comprehensive overview of the development work completed for ${projectName}. All milestones are cryptographically verified on the blockchain, ensuring transparency and authenticity.

## Project Overview

- **Project**: ${projectName}
- **Developer**: ${config.wallet.address}
- **Total Sessions**: ${logs.length}
- **Verified Milestones**: ${checkpoints.length}
- **Period**: ${this.getDateRange(logs)}

## Deliverables

${this.generateDeliverablesSection(checkpoints)}

## Development Activity

${this.generateActivitySection(logs)}

## Blockchain Verification

All milestones in this report are permanently recorded on BNB Smart Chain, providing tamper-proof evidence of completion dates and deliverables.

**Verification Link**: https://pugarhuda.github.io/VibeLog/?address=${config.wallet.address}

## Detailed Timeline

${this.generateTimelineSection(logs, checkpoints)}

---

*This report is cryptographically verified. Visit the verification link to confirm authenticity.*
`;
  }

  private generateGrantTemplate(
    logs: LogEntry[],
    checkpoints: Checkpoint[],
    config: any,
    projectName: string
  ): string {
    return `# ${projectName} - Grant Application Build Log

## Applicant Information

- **Project**: ${projectName}
- **Builder Address**: \`${config.wallet.address}\`
- **Verification**: [View on VibeLog](https://pugarhuda.github.io/VibeLog/?address=${config.wallet.address})

## Project Metrics

- **Development Sessions**: ${logs.length}
- **Verified Milestones**: ${checkpoints.length}
- **Total Code Changes**: ${this.getTotalLines(logs)} lines
- **Active Development Period**: ${this.getDateRange(logs)}
- **Blockchain Network**: BNB Smart Chain

## Proof of Work

All development milestones are cryptographically verified and stored onchain, providing transparent proof of consistent development activity.

${this.generateCheckpointsSection(checkpoints, config)}

## Development Progress

${this.generateTimelineSection(logs, checkpoints)}

## Technical Stack

${this.generateTechStackSection(logs)}

## Conclusion

This build log demonstrates consistent development progress with verifiable onchain checkpoints. All timestamps and code metrics are cryptographically secured on BNB Smart Chain.

---

*Verified with VibeLog - Transparent Build Logging on BNB Chain*
`;
  }

  private generateDefaultTemplate(
    logs: LogEntry[],
    checkpoints: Checkpoint[],
    config: any,
    projectName: string
  ): string {
    return `# ${projectName} - Build Log

${this.generateTimelineSection(logs, checkpoints)}

${this.generateCheckpointsSection(checkpoints, config)}
`;
  }

  private exportHTML(
    logs: LogEntry[],
    checkpoints: Checkpoint[],
    config: any,
    template: ExportTemplate,
    options: any
  ): string {
    const markdown = this.exportMarkdown(logs, checkpoints, config, template, options);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.projectName || 'Project'} - Build Log</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 3px solid #f0b90b; padding-bottom: 10px; }
    h2 { color: #2c3e50; margin-top: 30px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    a { color: #f0b90b; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .checkpoint { background: #f9f9f9; border-left: 4px solid #f0b90b; padding: 15px; margin: 15px 0; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; color: #f0b90b; }
  </style>
</head>
<body>
  ${this.markdownToHTML(markdown)}
</body>
</html>`;
  }

  private exportJSON(logs: LogEntry[], checkpoints: Checkpoint[], config: any): string {
    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      config: {
        wallet: config.wallet.address,
        network: config.network.name,
      },
      stats: {
        totalLogs: logs.length,
        totalCheckpoints: checkpoints.length,
        totalLines: this.getTotalLines(logs),
      },
      logs,
      checkpoints,
    }, null, 2);
  }

  private exportCSV(logs: LogEntry[]): string {
    const headers = 'Timestamp,Message,Commit Hash,Files Changed,Lines Added,Lines Deleted,AI Summary';
    const rows = logs.map(log => {
      const date = new Date(log.timestamp * 1000).toISOString();
      const message = `"${log.message.replace(/"/g, '""')}"`;
      const commit = log.commit?.hash || '';
      const files = log.diff?.filesChanged || 0;
      const added = log.diff?.linesAdded || 0;
      const deleted = log.diff?.linesDeleted || 0;
      const summary = log.aiSummary ? `"${log.aiSummary.replace(/"/g, '""')}"` : '';
      return `${date},${message},${commit},${files},${added},${deleted},${summary}`;
    });

    return [headers, ...rows].join('\n');
  }

  private generateTimelineSection(logs: LogEntry[], checkpoints: Checkpoint[]): string {
    const grouped = this.groupLogsByDay(logs);
    let output = '';

    for (const [date, dayLogs] of Object.entries(grouped)) {
      const checkpoint = checkpoints.find(cp => 
        new Date(cp.timestamp * 1000).toDateString() === date
      );

      output += `\n### ${date}\n\n`;
      
      for (const log of dayLogs) {
        const time = new Date(log.timestamp * 1000).toLocaleTimeString();
        output += `**${time}** - ${log.message}\n`;
        if (log.diff) {
          output += `  *+${log.diff.linesAdded}/-${log.diff.linesDeleted} lines, ${log.diff.filesChanged} files*\n`;
        }
        if (log.aiSummary) {
          output += `  > ${log.aiSummary}\n`;
        }
        output += '\n';
      }

      if (checkpoint) {
        output += `🔐 **Checkpoint**: ${checkpoint.summary}\n`;
        output += `  *TX: \`${checkpoint.blockchain.txHash}\`*\n\n`;
      }
    }

    return output;
  }

  private generateCheckpointsSection(checkpoints: Checkpoint[], config: any): string {
    if (checkpoints.length === 0) return '*No checkpoints yet*';

    let output = '';
    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      const date = new Date(cp.timestamp * 1000).toLocaleString();
      const explorerUrl = `${config.network.name === 'bsc-mainnet' ? 'https://bscscan.com' : 'https://testnet.bscscan.com'}/tx/${cp.blockchain.txHash}`;
      
      output += `\n#### Checkpoint ${i + 1}: ${cp.summary}\n\n`;
      output += `- **Date**: ${date}\n`;
      output += `- **Hash**: \`${cp.logHash}\`\n`;
      output += `- **Transaction**: [${cp.blockchain.txHash.substring(0, 10)}...](${explorerUrl})\n`;
      output += `- **Gas Used**: ${cp.blockchain.gasUsed}\n`;
      output += `- **Sessions Included**: ${cp.logs.length}\n\n`;
    }

    return output;
  }

  private generateDeliverablesSection(checkpoints: Checkpoint[]): string {
    return checkpoints.map((cp, i) => 
      `${i + 1}. **${cp.summary}** - ${new Date(cp.timestamp * 1000).toLocaleDateString()}`
    ).join('\n');
  }

  private generateActivitySection(logs: LogEntry[]): string {
    const totalFiles = new Set(logs.flatMap(l => l.diff?.files || [])).size;
    const totalCommits = logs.filter(l => l.commit).length;
    
    return `- **Total Commits**: ${totalCommits}
- **Files Modified**: ${totalFiles}
- **Total Changes**: ${this.getTotalLines(logs)} lines
- **Sessions**: ${logs.length}`;
  }

  private generateTechStackSection(logs: LogEntry[]): string {
    const extensions = new Set<string>();
    logs.forEach(log => {
      log.diff?.files.forEach(file => {
        const ext = file.split('.').pop();
        if (ext) extensions.add(ext);
      });
    });

    return Array.from(extensions).map(ext => `- ${ext}`).join('\n');
  }

  private groupLogsByDay(logs: LogEntry[]): Record<string, LogEntry[]> {
    const grouped: Record<string, LogEntry[]> = {};
    
    for (const log of logs) {
      const date = new Date(log.timestamp * 1000).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(log);
    }

    return grouped;
  }

  private getTotalLines(logs: LogEntry[]): number {
    return logs.reduce((sum, l) => 
      sum + (l.diff?.linesAdded || 0) + (l.diff?.linesDeleted || 0), 0
    );
  }

  private getDateRange(logs: LogEntry[]): string {
    if (logs.length === 0) return 'N/A';
    const dates = logs.map(l => l.timestamp).sort();
    const start = new Date(dates[0] * 1000).toLocaleDateString();
    const end = new Date(dates[dates.length - 1] * 1000).toLocaleDateString();
    return `${start} - ${end}`;
  }

  private loadAllCheckpoints(): Checkpoint[] {
    const dir = getCheckpointsDir();
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as Checkpoint)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$2</h2>')
      .replace(/^### (.*$)/gim, '<h3>$3</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gim, '<p>$1</p>');
  }
}
