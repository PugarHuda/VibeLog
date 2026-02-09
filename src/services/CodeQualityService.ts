import { AISummarizer } from './AISummarizer.js';
import { GitService } from './GitService.js';
import type { LogEntry } from '../types/index.js';

export interface CodeQualityIssue {
  type: 'security' | 'performance' | 'style' | 'best-practice';
  severity: 'high' | 'medium' | 'low';
  message: string;
  file?: string;
  suggestion?: string;
}

export interface CodeQualityReport {
  score: number;
  issues: CodeQualityIssue[];
  summary: string;
  recommendations: string[];
}

export class CodeQualityService {
  private aiSummarizer: AISummarizer;
  private gitService: GitService;

  constructor() {
    this.aiSummarizer = new AISummarizer();
    this.gitService = new GitService();
  }

  async analyzeLog(log: LogEntry): Promise<CodeQualityReport> {
    const issues: CodeQualityIssue[] = [];
    
    // Static analysis
    issues.push(...this.detectCommonIssues(log));
    
    // AI-powered analysis if available
    let aiSummary = '';
    let aiRecommendations: string[] = [];
    
    if (this.aiSummarizer.isAvailable()) {
      const aiAnalysis = await this.analyzeWithAI(log);
      aiSummary = aiAnalysis.summary;
      aiRecommendations = aiAnalysis.recommendations;
    }

    const score = this.calculateScore(issues);

    return {
      score,
      issues,
      summary: aiSummary || this.generateSummary(issues),
      recommendations: aiRecommendations.length > 0 ? aiRecommendations : this.generateRecommendations(issues),
    };
  }

  private detectCommonIssues(log: LogEntry): CodeQualityIssue[] {
    const issues: CodeQualityIssue[] = [];

    if (!log.diff) return issues;

    // Large commit detection
    const totalLines = (log.diff.linesAdded || 0) + (log.diff.linesDeleted || 0);
    if (totalLines > 500) {
      issues.push({
        type: 'best-practice',
        severity: 'medium',
        message: 'Large commit detected',
        suggestion: 'Consider breaking large changes into smaller, focused commits',
      });
    }

    // Too many files changed
    if (log.diff.filesChanged > 20) {
      issues.push({
        type: 'best-practice',
        severity: 'medium',
        message: 'Many files changed in single commit',
        suggestion: 'Try to keep commits focused on specific features or fixes',
      });
    }

    // Check for potential security issues in file names
    const sensitiveFiles = log.diff.files?.filter(f => 
      f.includes('.env') || 
      f.includes('secret') || 
      f.includes('password') ||
      f.includes('private')
    ) || [];

    if (sensitiveFiles.length > 0) {
      issues.push({
        type: 'security',
        severity: 'high',
        message: 'Sensitive files detected in commit',
        file: sensitiveFiles[0],
        suggestion: 'Ensure sensitive data is not committed. Use .gitignore',
      });
    }

    // Check commit message quality
    if (log.commit) {
      const message = log.commit.message.toLowerCase();
      
      if (message.length < 10) {
        issues.push({
          type: 'best-practice',
          severity: 'low',
          message: 'Commit message too short',
          suggestion: 'Write descriptive commit messages explaining what and why',
        });
      }

      if (/^(fix|update|change|wip)$/i.test(message.trim())) {
        issues.push({
          type: 'best-practice',
          severity: 'low',
          message: 'Generic commit message',
          suggestion: 'Be more specific about what was fixed or updated',
        });
      }
    }

    // Check for test files
    const hasTests = log.diff.files?.some(f => 
      f.includes('.test.') || 
      f.includes('.spec.') ||
      f.includes('__tests__')
    ) || false;

    if (!hasTests && log.diff.filesChanged > 3) {
      issues.push({
        type: 'best-practice',
        severity: 'low',
        message: 'No test files in commit',
        suggestion: 'Consider adding tests for new features',
      });
    }

    return issues;
  }

  private async analyzeWithAI(log: LogEntry): Promise<{ summary: string; recommendations: string[] }> {
    const prompt = `Analyze this code commit for quality issues:

Message: ${log.message}
${log.commit ? `Commit: ${log.commit.message}` : ''}
${log.diff ? `Files: ${log.diff.filesChanged}, +${log.diff.linesAdded}/-${log.diff.linesDeleted}` : ''}
${log.diff?.files ? `Changed files: ${log.diff.files.join(', ')}` : ''}

Provide:
1. A brief quality assessment (1-2 sentences)
2. Top 3 recommendations for improvement

Format:
SUMMARY: [your assessment]
RECOMMENDATIONS:
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]`;

    try {
      const response = await this.aiSummarizer['callGemini'](prompt);
      
      const summaryMatch = response.match(/SUMMARY:\s*(.+?)(?=RECOMMENDATIONS:|$)/s);
      const recommendationsMatch = response.match(/RECOMMENDATIONS:\s*(.+)/s);
      
      const summary = summaryMatch ? summaryMatch[1].trim() : '';
      const recommendations = recommendationsMatch 
        ? recommendationsMatch[1].split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
        : [];

      return { summary, recommendations };
    } catch {
      return { summary: '', recommendations: [] };
    }
  }

  private calculateScore(issues: CodeQualityIssue[]): number {
    let score = 100;

    for (const issue of issues) {
      if (issue.severity === 'high') score -= 15;
      else if (issue.severity === 'medium') score -= 10;
      else score -= 5;
    }

    return Math.max(0, score);
  }

  private generateSummary(issues: CodeQualityIssue[]): string {
    if (issues.length === 0) {
      return 'Code quality looks good! No major issues detected.';
    }

    const highSeverity = issues.filter(i => i.severity === 'high').length;
    const mediumSeverity = issues.filter(i => i.severity === 'medium').length;

    if (highSeverity > 0) {
      return `Found ${highSeverity} high-severity issue(s) that should be addressed.`;
    } else if (mediumSeverity > 0) {
      return `Found ${mediumSeverity} medium-severity issue(s). Consider reviewing.`;
    } else {
      return `Found ${issues.length} minor issue(s). Overall quality is acceptable.`;
    }
  }

  private generateRecommendations(issues: CodeQualityIssue[]): string[] {
    const recommendations: string[] = [];

    const highIssues = issues.filter(i => i.severity === 'high');
    if (highIssues.length > 0) {
      recommendations.push(`Address ${highIssues.length} high-severity security/quality issue(s)`);
    }

    const hasLargeCommit = issues.some(i => i.message.includes('Large commit'));
    if (hasLargeCommit) {
      recommendations.push('Break down large commits into smaller, focused changes');
    }

    const hasGenericMessage = issues.some(i => i.message.includes('Generic commit'));
    if (hasGenericMessage) {
      recommendations.push('Write more descriptive commit messages');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the good work!');
      recommendations.push('Consider adding more tests');
      recommendations.push('Document complex logic');
    }

    return recommendations.slice(0, 3);
  }

  async suggestCommitMessage(diff: string, files: string[]): Promise<string> {
    if (!this.aiSummarizer.isAvailable()) {
      return '';
    }

    const prompt = `Generate a concise, descriptive git commit message for these changes:

Files changed: ${files.join(', ')}
Diff summary: ${diff.substring(0, 500)}

Follow conventional commits format (feat:, fix:, docs:, etc.).
Be specific but concise (max 72 characters).
Only return the commit message, nothing else.`;

    try {
      const message = await this.aiSummarizer['callGemini'](prompt);
      return message.trim().split('\n')[0]; // First line only
    } catch {
      return '';
    }
  }

  async categorizeLog(log: LogEntry): Promise<string[]> {
    const categories: string[] = [];

    if (!log.diff?.files) return categories;

    // File-based categorization
    const files = log.diff.files;

    if (files.some(f => f.endsWith('.sol'))) categories.push('smart-contract');
    if (files.some(f => f.includes('test'))) categories.push('testing');
    if (files.some(f => f.endsWith('.md') || f.endsWith('.txt'))) categories.push('documentation');
    if (files.some(f => f.includes('frontend') || f.includes('ui') || f.endsWith('.tsx') || f.endsWith('.jsx'))) categories.push('frontend');
    if (files.some(f => f.includes('backend') || f.includes('api') || f.includes('server'))) categories.push('backend');
    if (files.some(f => f.includes('config') || f.includes('.json') || f.includes('.yaml'))) categories.push('configuration');
    if (files.some(f => f.includes('deploy') || f.includes('script'))) categories.push('deployment');

    // Message-based categorization
    const message = (log.message + ' ' + (log.commit?.message || '')).toLowerCase();

    if (message.includes('fix') || message.includes('bug')) categories.push('bugfix');
    if (message.includes('feat') || message.includes('feature')) categories.push('feature');
    if (message.includes('refactor')) categories.push('refactor');
    if (message.includes('perf') || message.includes('optimize')) categories.push('performance');
    if (message.includes('security')) categories.push('security');

    return Array.from(new Set(categories));
  }
}
