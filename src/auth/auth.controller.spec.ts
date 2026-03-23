import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole, UserStatus } from '../users/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    controller = new AuthController(authService);
  });

  it('delegates register to auth service', async () => {
    const dto = {
      email: 'new@example.com',
      name: 'New User',
      password: 'password123',
      role: UserRole.EMPLOYEE,
      teamId: 'team-1',
    };

    authService.register.mockResolvedValue({
      token: 'token-1',
      user: {
        id: 'user-1',
        email: dto.email,
        name: dto.name,
        role: dto.role,
        teamId: dto.teamId,
        status: UserStatus.ACTIVE,
      },
    });

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result.token).toBe('token-1');
  });

  it('delegates login to auth service', async () => {
    const dto = {
      email: 'jane@example.com',
      password: 'password123',
    };

    authService.login.mockResolvedValue({
      token: 'token-2',
      user: {
        id: 'user-2',
        email: dto.email,
        name: 'Jane',
        role: UserRole.MANAGER,
        teamId: 'team-1',
        status: UserStatus.ACTIVE,
        teamName: 'Platform',
      },
    });

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result.user.email).toBe(dto.email);
  });
});
