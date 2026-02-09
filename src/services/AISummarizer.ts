import type { LogEntry } from '../types/index.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  error?: { message: string };
}

export class AISummarizer {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  private async callGemini(prompt: string): Promise<string> {
    const url = `${GEMINI_API_URL}?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });

    const data = (await response.json()) as GeminiResponse;

    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  async summarizeLog(entry: LogEntry): Promise<string> {
    if (!this.isAvailable()) return '';

    const prompt = `You are a hackathon build log narrator. Write a brief, engaging 1-2 sentence summary of this development activity:

Message: ${entry.message}
${entry.commit ? `Commit: ${entry.commit.message}` : ''}
${entry.diff ? `Files changed: ${entry.diff.filesChanged}, +${entry.diff.linesAdded}/-${entry.diff.linesDeleted} lines` : ''}
${entry.diff?.files ? `Files: ${entry.diff.files.join(', ')}` : ''}

Write in third person, past tense. Be concise and technical. No markdown formatting.`;

    try {
      return await this.callGemini(prompt);
    } catch {
      return '';
    }
  }

  async generateNarrative(logs: LogEntry[]): Promise<string> {
    if (!this.isAvailable() || logs.length === 0) return '';

    const logsText = logs
      .map(
        (l, i) =>
          `Entry ${i + 1} (${new Date(l.timestamp * 1000).toISOString()}): ${l.message}${l.commit ? ` [commit: ${l.commit.message}]` : ''}${l.diff ? ` (+${l.diff.linesAdded}/-${l.diff.linesDeleted})` : ''}`
      )
      .join('\n');

    const prompt = `You are writing a hackathon build narrative. Given these build log entries, write a cohesive 2-3 paragraph narrative describing the development session:

${logsText}

Write in past tense. Be engaging but technical. Highlight key decisions and progress. No markdown formatting.`;

    try {
      return await this.callGemini(prompt);
    } catch {
      return '';
    }
  }

  async enhanceBuildLog(logs: LogEntry[], projectName: string): Promise<string> {
    if (!this.isAvailable() || logs.length === 0) return '';

    const logsText = logs
      .map(
        (l) =>
          `- ${new Date(l.timestamp * 1000).toLocaleDateString()}: ${l.message}${l.diff ? ` (+${l.diff.linesAdded}/-${l.diff.linesDeleted})` : ''}`
      )
      .join('\n');

    const prompt = `Write a brief reflection paragraph for a hackathon project build log.

Project: ${projectName}
Total entries: ${logs.length}
Build activities:
${logsText}

Write 2-3 sentences reflecting on the journey, challenges, and what was accomplished. First person, past tense. No markdown.`;

    try {
      return await this.callGemini(prompt);
    } catch {
      return '';
    }
  }
}
