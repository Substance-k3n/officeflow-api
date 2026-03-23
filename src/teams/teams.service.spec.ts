import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { TeamsService } from './teams.service';
import { Team } from './team.entity';
import { User, UserRole, UserStatus } from '../users/user.entity';

describe('TeamsService', () => {
  let service: TeamsService;
  let teamRepository: jest.Mocked<Repository<Team>>;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    teamRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<Team>>;

    userRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    service = new TeamsService(teamRepository, userRepository);
  });

  it('create throws when team name already exists', async () => {
    teamRepository.findOne.mockResolvedValue({ id: 'team-1' } as Team);

    await expect(service.create({ name: 'Platform' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('create throws when manager is missing', async () => {
    teamRepository.findOne.mockResolvedValue(null);
    teamRepository.create.mockReturnValue({ id: 'team-2', name: 'Platform' } as Team);
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({ name: 'Platform', managerId: 'missing-manager' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('create throws when selected manager is not manager role', async () => {
    teamRepository.findOne.mockResolvedValue(null);
    teamRepository.create.mockReturnValue({ id: 'team-3', name: 'Data' } as Team);
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      role: UserRole.EMPLOYEE,
    } as User);

    await expect(
      service.create({ name: 'Data', managerId: 'user-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('create saves a team with manager and returns response dto', async () => {
    teamRepository.findOne.mockResolvedValue(null);
    const team = { id: 'team-4', name: 'Ops' } as Team;
    teamRepository.create.mockReturnValue(team);
    userRepository.findOne.mockResolvedValue({
      id: 'manager-1',
      name: 'Manager User',
      role: UserRole.MANAGER,
    } as User);
    teamRepository.save.mockResolvedValue(team);

    const result = await service.create({
      name: 'Ops',
      managerId: 'manager-1',
    });

    expect(teamRepository.save).toHaveBeenCalledWith(team);
    expect(result).toEqual({
      id: 'team-4',
      name: 'Ops',
      managerId: 'manager-1',
      managerName: 'Manager User',
      membersCount: 0,
    });
  });

  it('findAll maps teams including members count', async () => {
    teamRepository.find.mockResolvedValue([
      {
        id: 'team-1',
        name: 'Platform',
        managerId: 'manager-1',
        manager: { name: 'Lead' },
        members: [{}, {}],
      },
    ] as Team[]);

    const result = await service.findAll();

    expect(teamRepository.find).toHaveBeenCalledWith({
      relations: ['manager', 'members'],
    });
    expect(result).toEqual([
      {
        id: 'team-1',
        name: 'Platform',
        managerId: 'manager-1',
        managerName: 'Lead',
        membersCount: 2,
      },
    ]);
  });

  it('findTeamMembers throws when team does not exist', async () => {
    teamRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findTeamMembers('team-missing', {
        id: 'manager-1',
        role: UserRole.MANAGER,
      } as User),
    ).rejects.toThrow(NotFoundException);
  });

  it('findTeamMembers throws when manager accesses another team', async () => {
    teamRepository.findOne.mockResolvedValue({
      id: 'team-2',
      managerId: 'different-manager',
      members: [],
    } as Team);

    await expect(
      service.findTeamMembers('team-2', {
        id: 'manager-1',
        role: UserRole.MANAGER,
      } as User),
    ).rejects.toThrow(ForbiddenException);
  });

  it('findTeamMembers returns mapped members for HR', async () => {
    teamRepository.findOne.mockResolvedValue({
      id: 'team-3',
      managerId: 'manager-1',
      members: [
        {
          id: 'user-1',
          name: 'Jane',
          email: 'jane@example.com',
          role: UserRole.EMPLOYEE,
          status: UserStatus.ACTIVE,
        },
      ],
    } as Team);

    const result = await service.findTeamMembers('team-3', {
      id: 'hr-1',
      role: UserRole.HR,
    } as User);

    expect(result).toEqual([
      {
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
      },
    ]);
  });
});
