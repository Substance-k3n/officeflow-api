import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    service = new UsersService(userRepository);
  });

  it('findMe returns mapped user profile', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      role: UserRole.EMPLOYEE,
      teamId: 'team-1',
      status: UserStatus.ACTIVE,
      team: { name: 'Platform' } as any,
    } as User);

    const result = await service.findMe('user-1');

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      relations: ['team'],
    });
    expect(result).toEqual({
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      role: UserRole.EMPLOYEE,
      teamId: 'team-1',
      status: UserStatus.ACTIVE,
      teamName: 'Platform',
    });
  });

  it('findAll applies manager scope and query filters', async () => {
    const andWhere = jest.fn().mockReturnThis();
    const leftJoinAndSelect = jest.fn().mockReturnThis();
    const getMany = jest.fn().mockResolvedValue([
      {
        id: 'user-2',
        name: 'Manager',
        email: 'manager@example.com',
        role: UserRole.MANAGER,
        teamId: 'team-1',
        status: UserStatus.ACTIVE,
        team: { name: 'Platform' },
      },
    ]);

    userRepository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect,
      andWhere,
      getMany,
    } as any);

    const result = await service.findAll(
      {
        teamId: 'team-1',
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        search: 'manager',
      },
      {
        id: 'current-manager',
        role: UserRole.MANAGER,
        teamId: 'team-1',
      } as User,
    );

    expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(leftJoinAndSelect).toHaveBeenCalledWith('user.team', 'team');
    expect(andWhere).toHaveBeenCalledWith('user.teamId = :teamId', {
      teamId: 'team-1',
    });
    expect(andWhere).toHaveBeenCalledWith('user.role = :role', {
      role: UserRole.MANAGER,
    });
    expect(andWhere).toHaveBeenCalledWith('user.status = :status', {
      status: UserStatus.ACTIVE,
    });
    expect(andWhere).toHaveBeenCalledWith(
      '(user.name ILIKE :search OR user.email ILIKE :search)',
      { search: '%manager%' },
    );
    expect(result).toEqual([
      {
        id: 'user-2',
        name: 'Manager',
        email: 'manager@example.com',
        role: UserRole.MANAGER,
        teamId: 'team-1',
        status: UserStatus.ACTIVE,
        teamName: 'Platform',
      },
    ]);
  });

  it('findAll for HR without filters returns all mapped users', async () => {
    const leftJoinAndSelect = jest.fn().mockReturnThis();
    const andWhere = jest.fn().mockReturnThis();
    const getMany = jest.fn().mockResolvedValue([
      {
        id: 'user-3',
        name: 'HR User',
        email: 'hr@example.com',
        role: UserRole.HR,
        teamId: null,
        status: UserStatus.ACTIVE,
      },
    ]);

    userRepository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect,
      andWhere,
      getMany,
    } as any);

    const result = await service.findAll(
      {},
      { id: 'hr-1', role: UserRole.HR } as User,
    );

    expect(getMany).toHaveBeenCalled();
    expect(result[0].email).toBe('hr@example.com');
  });
});
