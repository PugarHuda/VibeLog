import { simpleGit, SimpleGit } from 'simple-git';

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface DiffInfo {
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  files: string[];
}

export class GitService {
  private git: SimpleGit;

  constructor(cwd?: string) {
    this.git = simpleGit(cwd || process.cwd());
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async getLatestCommit(): Promise<CommitInfo | null> {
    try {
      const log = await this.git.log({ maxCount: 1 });
      if (!log.latest) return null;
      return {
        hash: log.latest.hash.substring(0, 7),
        message: log.latest.message,
        author: log.latest.author_name,
        date: log.latest.date,
      };
    } catch {
      return null;
    }
  }

  async getDiffStats(): Promise<DiffInfo | null> {
    try {
      const diff = await this.git.diffSummary(['HEAD~1', 'HEAD']);
      const filtered = diff.files.filter((f) => !f.file.startsWith('.vibelog'));
      const added = filtered.reduce((s, f) => s + ('insertions' in f ? f.insertions : 0), 0);
      const deleted = filtered.reduce((s, f) => s + ('deletions' in f ? f.deletions : 0), 0);
      return {
        filesChanged: filtered.length,
        linesAdded: added,
        linesDeleted: deleted,
        files: filtered.map((f) => f.file),
      };
    } catch {
      try {
        const diff = await this.git.diffSummary();
        const filtered = diff.files.filter((f) => !f.file.startsWith('.vibelog'));
        const added = filtered.reduce((s, f) => s + ('insertions' in f ? f.insertions : 0), 0);
        const deleted = filtered.reduce((s, f) => s + ('deletions' in f ? f.deletions : 0), 0);
        return {
          filesChanged: filtered.length,
          linesAdded: added,
          linesDeleted: deleted,
          files: filtered.map((f) => f.file),
        };
      } catch {
        return null;
      }
    }
  }

  async getRepoInfo(): Promise<{ name: string; branch: string } | null> {
    try {
      const branch = await this.git.branchLocal();
      const remotes = await this.git.getRemotes(true);
      let name = 'unknown';
      if (remotes.length > 0 && remotes[0].refs.fetch) {
        const url = remotes[0].refs.fetch;
        const match = url.match(/\/([^/]+?)(?:\.git)?$/);
        if (match) name = match[1];
      }
      return { name, branch: branch.current };
    } catch {
      return null;
    }
  }

  async detectFramework(): Promise<string[]> {
    const detected: string[] = [];
    try {
      const files = await this.git.raw(['ls-files']);
      const fileList = files.split('\n');

      if (fileList.some((f) => f.includes('hardhat.config'))) detected.push('Hardhat');
      if (fileList.some((f) => f.includes('foundry.toml'))) detected.push('Foundry');
      if (fileList.some((f) => f.includes('next.config'))) detected.push('Next.js');
      if (fileList.some((f) => f.includes('package.json'))) detected.push('Node.js');
      if (fileList.some((f) => f.endsWith('.sol'))) detected.push('Solidity');
      if (fileList.some((f) => f.endsWith('.rs'))) detected.push('Rust');
      if (fileList.some((f) => f.endsWith('.py'))) detected.push('Python');
    } catch {
      // Not a git repo or empty
    }
    return detected;
  }
}
