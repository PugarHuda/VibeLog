import { TeamService } from '../src/services/TeamService.js';

describe('TeamService', () => {
  let teamService: TeamService;

  it('should create TeamService instance', () => {
    teamService = new TeamService();
    expect(teamService).toBeDefined();
  });

  it('should have getMembers method', () => {
    teamService = new TeamService();
    expect(typeof teamService.getMembers).toBe('function');
  });

  it('should have addMember method', () => {
    teamService = new TeamService();
    expect(typeof teamService.addMember).toBe('function');
  });

  it('should have removeMember method', () => {
    teamService = new TeamService();
    expect(typeof teamService.removeMember).toBe('function');
  });

  it('should have isMember method', () => {
    teamService = new TeamService();
    expect(typeof teamService.isMember).toBe('function');
  });

  it('should have getMemberInfo method', () => {
    teamService = new TeamService();
    expect(typeof teamService.getMemberInfo).toBe('function');
  });

  it('should have setProjectName method', () => {
    teamService = new TeamService();
    expect(typeof teamService.setProjectName).toBe('function');
  });
});
