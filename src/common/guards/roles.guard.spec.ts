import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/user.entity';

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  const createContext = (user?: { role: UserRole }): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('returns true when route has no required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(createContext({ role: UserRole.EMPLOYEE }));

    expect(result).toBe(true);
  });

  it('throws when user is missing from request', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.HR]);

    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
  });

  it('returns true when user has one of required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.HR, UserRole.MANAGER]);

    const result = guard.canActivate(createContext({ role: UserRole.MANAGER }));

    expect(result).toBe(true);
  });

  it('throws when user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.HR]);

    expect(() =>
      guard.canActivate(createContext({ role: UserRole.EMPLOYEE })),
    ).toThrow(ForbiddenException);
  });
});
