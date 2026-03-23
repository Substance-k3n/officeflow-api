import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole, UserStatus } from './user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    usersService = {
      findMe: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    controller = new UsersController(usersService);
  });

  it('getMe returns current user profile', async () => {
    usersService.findMe.mockResolvedValue({
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      role: UserRole.EMPLOYEE,
      teamId: 'team-1',
      status: UserStatus.ACTIVE,
      teamName: 'Platform',
    });

    const result = await controller.getMe({ id: 'user-1' } as any);

    expect(usersService.findMe).toHaveBeenCalledWith('user-1');
    expect(result.email).toBe('jane@example.com');
  });

  it('listUsers forwards query and current user', async () => {
    usersService.findAll.mockResolvedValue([
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

    const query = { search: 'manager' };
    const currentUser = { id: 'hr-1', role: UserRole.HR } as any;

    const result = await controller.listUsers(query, currentUser);

    expect(usersService.findAll).toHaveBeenCalledWith(query, currentUser);
    expect(result).toHaveLength(1);
  });
});
