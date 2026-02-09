import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getVibelogDir } from '../utils/config.js';

export interface GitHubConfig {
  connected: boolean;
  username?: string;
  repo?: string;
  token?: string;
  lastSync?: number;
}

export interface GitHubRelease {
  tag: string;
  name: string;
  publishedAt: string;
  body: string;
}

export class GitHubService {
  private configPath: string;

  constructor() {
    this.configPath = join(getVibelogDir(), 'github.json');
  }

  private loadConfig(): GitHubConfig {
    if (!existsSync(this.configPath)) {
      return { connected: false };
    }
    try {
      const raw = readFileSync(this.configPath, 'utf-8');
      return JSON.parse(raw) as GitHubConfig;
    } catch {
      return { connected: false };
    }
  }

  private saveConfig(config: GitHubConfig): void {
    writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  isConnected(): boolean {
    return this.loadConfig().connected;
  }

  connect(username: string, repo: string, token: string): void {
    this.saveConfig({
      connected: true,
      username,
      repo,
      token,
      lastSync: Math.floor(Date.now() / 1000),
    });
  }

  disconnect(): void {
    this.saveConfig({ connected: false });
  }

  getConfig(): GitHubConfig {
    return this.loadConfig();
  }

  async fetchReleases(): Promise<GitHubRelease[]> {
    const config = this.loadConfig();
    if (!config.connected || !config.username || !config.repo) {
      throw new Error('GitHub not connected');
    }

    const url = `https://api.github.com/repos/${config.username}/${config.repo}/releases`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (config.token) {
      headers['Authorization'] = `token ${config.token}`;
    }

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const releases = await response.json() as any[];
      return releases.map(r => ({
        tag: r.tag_name,
        name: r.name,
        publishedAt: r.published_at,
        body: r.body || '',
      }));
    } catch (error) {
      throw new Error(`Failed to fetch releases: ${error}`);
    }
  }

  generateBadge(address: string, checkpointCount: number): string {
    const badgeUrl = `https://img.shields.io/badge/VibeLog-${checkpointCount}%20checkpoints-blue`;
    const verifierUrl = `https://pugarhuda.github.io/VibeLog/?address=${address}`;
    
    return `[![VibeLog Verified](${badgeUrl})](${verifierUrl})`;
  }

  generateReadmeSection(address: string, checkpointCount: number, projectName: string): string {
    const badge = this.generateBadge(address, checkpointCount);
    const verifierUrl = `https://pugarhuda.github.io/VibeLog/?address=${address}`;

    return `## 🔐 Build Verification

${badge}

This project uses [VibeLog](https://github.com/PugarHuda/VibeLog) for verified build logging.

- **Project**: ${projectName}
- **Checkpoints**: ${checkpointCount} onchain proofs
- **Verify**: [View on VibeLog Verifier](${verifierUrl})

All build checkpoints are cryptographically verified and stored on BNB Smart Chain.
`;
  }
}
