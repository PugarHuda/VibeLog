import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getVibelogDir } from '../utils/config.js';
import { ethers } from 'ethers';

export interface TeamMember {
  address: string;
  name?: string;
  role?: string;
  addedAt: number;
  addedBy: string;
}

export interface TeamConfig {
  members: TeamMember[];
  sharedProject: boolean;
  projectName?: string;
}

export class TeamService {
  private teamPath: string;

  constructor() {
    this.teamPath = join(getVibelogDir(), 'team.json');
  }

  private loadTeam(): TeamConfig {
    if (!existsSync(this.teamPath)) {
      return { members: [], sharedProject: false };
    }
    try {
      const raw = readFileSync(this.teamPath, 'utf-8');
      return JSON.parse(raw) as TeamConfig;
    } catch {
      return { members: [], sharedProject: false };
    }
  }

  private saveTeam(team: TeamConfig): void {
    writeFileSync(this.teamPath, JSON.stringify(team, null, 2));
  }

  isTeamProject(): boolean {
    const team = this.loadTeam();
    return team.sharedProject && team.members.length > 0;
  }

  getMembers(): TeamMember[] {
    return this.loadTeam().members;
  }

  addMember(address: string, addedBy: string, name?: string, role?: string): void {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    const team = this.loadTeam();
    
    if (team.members.some(m => m.address.toLowerCase() === address.toLowerCase())) {
      throw new Error('Member already exists');
    }

    team.members.push({
      address: ethers.getAddress(address),
      name,
      role,
      addedAt: Math.floor(Date.now() / 1000),
      addedBy,
    });

    team.sharedProject = true;
    this.saveTeam(team);
  }

  removeMember(address: string): void {
    const team = this.loadTeam();
    team.members = team.members.filter(
      m => m.address.toLowerCase() !== address.toLowerCase()
    );
    this.saveTeam(team);
  }

  isMember(address: string): boolean {
    const team = this.loadTeam();
    return team.members.some(
      m => m.address.toLowerCase() === address.toLowerCase()
    );
  }

  getMemberInfo(address: string): TeamMember | undefined {
    const team = this.loadTeam();
    return team.members.find(
      m => m.address.toLowerCase() === address.toLowerCase()
    );
  }

  setProjectName(name: string): void {
    const team = this.loadTeam();
    team.projectName = name;
    this.saveTeam(team);
  }

  getProjectName(): string | undefined {
    return this.loadTeam().projectName;
  }
}
