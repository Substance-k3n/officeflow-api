import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { Team } from '../teams/team.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let teamRepository: jest.Mocked<Repository<Team>>;
  let jwtService: jest.Mocked<JwtService>;

  const hashMock = bcrypt.hash as unknown as jest.Mock;
  const compareMock = bcrypt.compare as unknown as jest.Mock;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    teamRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Team>>;

    jwtService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    service = new AuthService(userRepository, teamRepository, jwtService);
    jest.clearAllMocks();
  });

  it('registers a new user and returns token + profile', async () => {
    const registerDto = {
      email: 'new@example.com',
      name: 'New User',
      password: 'password123',
      role: UserRole.EMPLOYEE,
      teamId: 'team-1',
    };

    userRepository.findOne.mockResolvedValue(null);
    teamRepository.findOne.mockResolvedValue({ id: 'team-1' } as Team);
    hashMock.mockResolvedValue('hashed-password');

    const createdUser = {
      id: 'user-1',
      email: registerDto.email,
      name: registerDto.name,
      password: 'hashed-password',
      role: registerDto.role,
      teamId: registerDto.teamId,
      status: UserStatus.ACTIVE,
    } as User;

    userRepository.create.mockReturnValue(createdUser);
    userRepository.save.mockResolvedValue(createdUser);
    jwtService.sign.mockReturnValue('jwt-token');

    const result = await service.register(registerDto);

    expect(hashMock).toHaveBeenCalledWith('password123', 10);
    expect(userRepository.save).toHaveBeenCalledWith(createdUser);
    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: 'user-1',
      role: UserRole.EMPLOYEE,
      teamId: 'team-1',
    });
    expect(result.token).toBe('jwt-token');
    expect(result.user.email).toBe(registerDto.email);
  });

  it('throws ConflictException when email already exists during register', async () => {
    userRepository.findOne.mockResolvedValue({ id: 'existing' } as User);

    await expect(
      service.register({
        email: 'existing@example.com',
        name: 'Existing',
        password: 'password123',
        role: UserRole.EMPLOYEE,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('throws BadRequestException when provided team does not exist', async () => {
    userRepository.findOne.mockResolvedValue(null);
    teamRepository.findOne.mockResolvedValue(null);

    await expect(
      service.register({
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
        role: UserRole.EMPLOYEE,
        teamId: 'missing-team',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws UnauthorizedException when login password is invalid', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'jane@example.com',
      name: 'Jane',
      password: 'hashed',
      role: UserRole.EMPLOYEE,
      teamId: 'team-1',
      status: UserStatus.ACTIVE,
    } as User);

    compareMock.mockResolvedValue(false);

    await expect(
      service.login({ email: 'jane@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('logs in active user and returns team name when available', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-2',
      email: 'manager@example.com',
      name: 'Manager',
      password: 'hashed',
      role: UserRole.MANAGER,
      teamId: 'team-1',
      status: UserStatus.ACTIVE,
      team: { name: 'Platform' } as Team,
    } as User);

    compareMock.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('jwt-token-2');

    const result = await service.login({
      email: 'manager@example.com',
      password: 'password123',
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: 'user-2',
      role: UserRole.MANAGER,
      teamId: 'team-1',
    });
    expect(result.token).toBe('jwt-token-2');
    expect(result.user.teamName).toBe('Platform');
  });
});
