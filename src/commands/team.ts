import chalk from 'chalk';
import inquirer from 'inquirer';
import { TeamService } from '../services/TeamService.js';
import { loadConfig } from '../utils/config.js';

export async function teamAddCommand(address?: string): Promise<void> {
  const teamService = new TeamService();
  const config = loadConfig();

  let memberAddress = address;
  let name: string | undefined;
  let role: string | undefined;

  if (!memberAddress) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'address',
        message: 'Team member wallet address:',
        validate: (input) => input.length > 0 || 'Address is required',
      },
      {
        type: 'input',
        name: 'name',
        message: 'Member name (optional):',
      },
      {
        type: 'input',
        name: 'role',
        message: 'Role (optional):',
      },
    ]);

    memberAddress = answers.address;
    name = answers.name || undefined;
    role = answers.role || undefined;
  }

  try {
    teamService.addMember(memberAddress!, config.wallet.address, name, role);
    console.log(chalk.green('✓ Team member added successfully!'));
    console.log(chalk.gray(`  Address: ${memberAddress}`));
    if (name) console.log(chalk.gray(`  Name: ${name}`));
    if (role) console.log(chalk.gray(`  Role: ${role}`));
  } catch (error) {
    console.log(chalk.red(`✗ Failed to add member: ${error}`));
    process.exit(1);
  }
}

export async function teamListCommand(): Promise<void> {
  const teamService = new TeamService();
  const members = teamService.getMembers();

  if (members.length === 0) {
    console.log(chalk.yellow('No team members yet. Add members with `vibe team add`'));
    return;
  }

  console.log(chalk.bold('\n👥 Team Members\n'));

  for (const member of members) {
    console.log(chalk.cyan(`${member.name || 'Unnamed'} ${member.role ? `(${member.role})` : ''}`));
    console.log(chalk.gray(`  Address: ${member.address}`));
    console.log(chalk.gray(`  Added: ${new Date(member.addedAt * 1000).toLocaleDateString()}`));
    console.log();
  }

  const projectName = teamService.getProjectName();
  if (projectName) {
    console.log(chalk.gray(`Project: ${projectName}`));
  }
}

export async function teamRemoveCommand(address?: string): Promise<void> {
  const teamService = new TeamService();

  if (!address) {
    const members = teamService.getMembers();
    if (members.length === 0) {
      console.log(chalk.yellow('No team members to remove'));
      return;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select member to remove:',
        choices: members.map(m => ({
          name: `${m.name || m.address} ${m.role ? `(${m.role})` : ''}`,
          value: m.address,
        })),
      },
    ]);

    address = selected;
  }

  try {
    teamService.removeMember(address!);
    console.log(chalk.green('✓ Team member removed'));
  } catch (error) {
    console.log(chalk.red(`✗ Failed to remove member: ${error}`));
    process.exit(1);
  }
}
