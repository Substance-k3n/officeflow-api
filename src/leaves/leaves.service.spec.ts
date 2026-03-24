import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { LeavesService } from './leaves.service';
import { LeaveRequest, LeaveStatus, LeaveType } from './leave-request.entity';
import { User, UserRole } from '../users/user.entity';

describe('LeavesService', () => {
  let service: LeavesService;
  let leaveRepository: jest.Mocked<Repository<LeaveRequest>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const makeQueryBuilder = () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };
    return qb;
  };

  beforeEach(() => {
    leaveRepository = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<Repository<LeaveRequest>>;

    userRepository = {} as jest.Mocked<Repository<User>>;

    service = new LeavesService(leaveRepository, userRepository);
  });

  it('create throws when end date is before start date', async () => {
    await expect(
      service.create(
        {
          type: LeaveType.VACATION,
          startDate: '2026-03-25',
          endDate: '2026-03-20',
          reason: 'invalid range',
        },
        { id: 'user-1', role: UserRole.EMPLOYEE } as User,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('create throws when approved leave conflicts', async () => {
    const qb = makeQueryBuilder();
    qb.getOne.mockResolvedValue({ id: 'leave-conflict' });
    leaveRepository.createQueryBuilder.mockReturnValue(qb as any);

    await expect(
      service.create(
        {
          type: LeaveType.SICK,
          startDate: '2026-03-20',
          endDate: '2026-03-21',
          reason: 'flu',
        },
        { id: 'user-1', role: UserRole.EMPLOYEE } as User,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('create stores pending leave for current user', async () => {
    const qb = makeQueryBuilder();
    qb.getOne.mockResolvedValue(null);
    leaveRepository.createQueryBuilder.mockReturnValue(qb as any);

    leaveRepository.create.mockImplementation((v: any) => v);
    leaveRepository.save.mockResolvedValue({
      id: 'leave-1',
      userId: 'user-1',
      type: LeaveType.VACATION,
      status: LeaveStatus.PENDING,
      startDate: '2026-03-20',
      endDate: '2026-03-21',
      reason: 'Trip',
      managerComment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LeaveRequest);

    const result = await service.create(
      {
        type: LeaveType.VACATION,
        startDate: '2026-03-20',
        endDate: '2026-03-21',
        reason: 'Trip',
      },
      { id: 'user-1', role: UserRole.EMPLOYEE } as User,
    );

    expect(leaveRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        status: LeaveStatus.PENDING,
      }),
    );
    expect(result.id).toBe('leave-1');
  });

  it('findOne throws when leave is missing', async () => {
    leaveRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findOne('missing', { id: 'user-1', role: UserRole.HR } as User),
    ).rejects.toThrow(NotFoundException);
  });

  it('findOne blocks employee from viewing another user leave', async () => {
    leaveRepository.findOne.mockResolvedValue({
      id: 'leave-1',
      userId: 'other-user',
      user: { teamId: 'team-1' },
    } as LeaveRequest);

    await expect(
      service.findOne('leave-1', { id: 'user-1', role: UserRole.EMPLOYEE } as User),
    ).rejects.toThrow(ForbiddenException);
  });

  it('update lets manager approve pending leave in same team', async () => {
    const leave = {
      id: 'leave-2',
      userId: 'employee-1',
      status: LeaveStatus.PENDING,
      type: LeaveType.VACATION,
      startDate: '2026-03-22',
      endDate: '2026-03-23',
      reason: 'Trip',
      user: { teamId: 'team-1', name: 'Emp', team: { name: 'Platform' } },
    } as LeaveRequest;

    leaveRepository.findOne.mockResolvedValue(leave);
    leaveRepository.save.mockResolvedValue({
      ...leave,
      status: LeaveStatus.APPROVED,
      managerComment: 'approved',
      updatedAt: new Date(),
      createdAt: new Date(),
    } as LeaveRequest);

    const result = await service.update(
      'leave-2',
      { status: LeaveStatus.APPROVED, managerComment: 'approved' },
      { id: 'manager-1', role: UserRole.MANAGER, teamId: 'team-1' } as User,
    );

    expect(result.status).toBe(LeaveStatus.APPROVED);
    expect(result.managerComment).toBe('approved');
  });

  it('delete blocks manager from deleting other team leaves', async () => {
    leaveRepository.findOne.mockResolvedValue({
      id: 'leave-3',
      userId: 'employee-2',
      status: LeaveStatus.PENDING,
      user: { teamId: 'team-2' },
    } as LeaveRequest);

    await expect(
      service.delete(
        'leave-3',
        { id: 'manager-1', role: UserRole.MANAGER, teamId: 'team-1' } as User,
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
