import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { GitHubService } from '../services/GitHubService.js';
import { loadConfig } from '../utils/config.js';
import { writeFileSync } from 'fs';

export async function githubConnectCommand(): Promise<void> {
  const githubService = new GitHubService();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'GitHub username:',
      validate: (input) => input.length > 0 || 'Username is required',
    },
    {
      type: 'input',
      name: 'repo',
      message: 'Repository name:',
      validate: (input) => input.length > 0 || 'Repository name is required',
    },
    {
      type: 'password',
      name: 'token',
      message: 'GitHub Personal Access Token (optional, for private repos):',
    },
  ]);

  try {
    githubService.connect(answers.username, answers.repo, answers.token);
    console.log(chalk.green('✓ GitHub connected successfully!'));
  } catch (error) {
    console.log(chalk.red(`✗ Connection failed: ${error}`));
    process.exit(1);
  }
}

export async function githubDisconnectCommand(): Promise<void> {
  const githubService = new GitHubService();
  githubService.disconnect();
  console.log(chalk.green('✓ GitHub disconnected'));
}

export async function githubSyncCommand(): Promise<void> {
  const githubService = new GitHubService();

  if (!githubService.isConnected()) {
    console.log(chalk.yellow('GitHub not connected. Run `vibe github connect` first.'));
    return;
  }

  const spinner = ora('Fetching GitHub releases...').start();

  try {
    const releases = await githubService.fetchReleases();
    spinner.succeed(chalk.green(`✓ Found ${releases.length} release(s)`));

    if (releases.length === 0) {
      console.log(chalk.gray('No releases found'));
      return;
    }

    console.log(chalk.bold('\n📦 Releases:\n'));

    for (const release of releases) {
      console.log(chalk.cyan(`${release.tag} - ${release.name}`));
      console.log(chalk.gray(`  Published: ${new Date(release.publishedAt).toLocaleDateString()}`));
      if (release.body) {
        console.log(chalk.gray(`  ${release.body.substring(0, 100)}...`));
      }
      console.log();
    }

    const { shouldCreateCheckpoints } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCreateCheckpoints',
        message: 'Create checkpoints from releases?',
        default: false,
      },
    ]);

    if (shouldCreateCheckpoints) {
      console.log(chalk.yellow('\n💡 Tip: Use `vibe checkpoint "Release: <tag>"` to create checkpoints manually'));
    }

  } catch (error) {
    spinner.fail(chalk.red(`✗ Failed to fetch releases: ${error}`));
    process.exit(1);
  }
}

export async function githubBadgeCommand(): Promise<void> {
  const githubService = new GitHubService();
  const config = loadConfig();

  const badge = githubService.generateBadge(
    config.wallet.address,
    config.stats.totalCheckpoints
  );

  console.log(chalk.bold('\n🏅 VibeLog Badge\n'));
  console.log(chalk.gray('Add this to your README.md:\n'));
  console.log(chalk.cyan(badge));
  console.log();

  const { addToReadme } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addToReadme',
      message: 'Generate full README section?',
      default: true,
    },
  ]);

  if (addToReadme) {
    const { projectName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'My Project',
      },
    ]);

    const section = githubService.generateReadmeSection(
      config.wallet.address,
      config.stats.totalCheckpoints,
      projectName
    );

    console.log(chalk.bold('\n📝 README Section:\n'));
    console.log(section);

    const { save } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'save',
        message: 'Save to VIBELOG_BADGE.md?',
        default: true,
      },
    ]);

    if (save) {
      writeFileSync('VIBELOG_BADGE.md', section);
      console.log(chalk.green('\n✓ Saved to VIBELOG_BADGE.md'));
    }
  }
}

export async function githubStatusCommand(): Promise<void> {
  const githubService = new GitHubService();
  const config = githubService.getConfig();

  if (!config.connected) {
    console.log(chalk.yellow('GitHub not connected'));
    console.log(chalk.gray('Run `vibe github connect` to get started'));
    return;
  }

  console.log(chalk.bold('\n🐙 GitHub Status\n'));
  console.log(chalk.green('✓ Connected'));
  console.log(chalk.gray(`  Username: ${config.username}`));
  console.log(chalk.gray(`  Repository: ${config.repo}`));
  if (config.lastSync) {
    console.log(chalk.gray(`  Last sync: ${new Date(config.lastSync * 1000).toLocaleString()}`));
  }
}
