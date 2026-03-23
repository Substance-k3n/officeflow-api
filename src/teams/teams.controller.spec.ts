import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { UserRole, UserStatus } from '../users/user.entity';

describe('TeamsController', () => {
  let controller: TeamsController;
  let teamsService: jest.Mocked<TeamsService>;

  beforeEach(() => {
    teamsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findTeamMembers: jest.fn(),
    } as unknown as jest.Mocked<TeamsService>;

    controller = new TeamsController(teamsService);
  });

  it('createTeam delegates to service', async () => {
    teamsService.create.mockResolvedValue({
      id: 'team-1',
      name: 'Platform',
      managerId: 'manager-1',
      managerName: 'Lead',
      membersCount: 0,
    });

    const dto = { name: 'Platform', managerId: 'manager-1' };
    const result = await controller.createTeam(dto as any);

    expect(teamsService.create).toHaveBeenCalledWith(dto);
    expect(result.name).toBe('Platform');
  });

  it('listTeams returns all teams', async () => {
    teamsService.findAll.mockResolvedValue([
      {
        id: 'team-1',
        name: 'Platform',
        managerId: 'manager-1',
        managerName: 'Lead',
        membersCount: 5,
      },
    ]);

    const result = await controller.listTeams();

    expect(teamsService.findAll).toHaveBeenCalled();
    expect(result[0].membersCount).toBe(5);
  });

  it('getTeamMembers forwards teamId and user', async () => {
    teamsService.findTeamMembers.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
      },
    ]);

    const currentUser = { id: 'manager-1', role: UserRole.MANAGER } as any;
    const result = await controller.getTeamMembers('team-1', currentUser);

    expect(teamsService.findTeamMembers).toHaveBeenCalledWith('team-1', currentUser);
    expect(result).toHaveLength(1);
  });
});
