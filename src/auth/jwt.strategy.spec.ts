import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { JwtStrategy } from './jwt.strategy';
import { User, UserRole, UserStatus } from '../users/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as jest.Mocked<ConfigService>;

    userRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    strategy = new JwtStrategy(configService, userRepository);
  });

  it('returns user when user exists and is active', async () => {
    const user = {
      id: 'user-1',
      name: 'Jane',
      email: 'jane@example.com',
      role: UserRole.EMPLOYEE,
      teamId: 'team-1',
      status: UserStatus.ACTIVE,
    } as User;

    userRepository.findOne.mockResolvedValue(user);

    const result = await strategy.validate({
      userId: 'user-1',
      role: UserRole.EMPLOYEE,
      teamId: 'team-1',
    });

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      relations: ['team'],
    });
    expect(result).toBe(user);
  });

  it('throws UnauthorizedException when user does not exist', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      strategy.validate({ userId: 'missing', role: UserRole.HR, teamId: null }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when user is inactive', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-2',
      status: UserStatus.INACTIVE,
    } as User);

    await expect(
      strategy.validate({ userId: 'user-2', role: UserRole.MANAGER, teamId: 'team-1' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
