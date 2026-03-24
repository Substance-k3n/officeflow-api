import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { LeaveRequest, LeaveStatus, LeaveType } from '../leaves/leave-request.entity';
import { User, UserRole } from '../users/user.entity';
import { Team } from '../teams/team.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let leaveRepository: jest.Mocked<Repository<LeaveRequest>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let teamRepository: jest.Mocked<Repository<Team>>;

  const makeQueryBuilder = () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    return qb;
  };

  beforeEach(() => {
    leaveRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<LeaveRequest>>;

    userRepository = {
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    teamRepository = {} as jest.Mocked<Repository<Team>>;

    service = new ReportsService(leaveRepository, userRepository, teamRepository);
  });

  it('getLeavesSummary aggregates counts for HR', async () => {
    const today = new Date().toISOString().split('T')[0];
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue([
      {
        status: LeaveStatus.APPROVED,
        type: LeaveType.VACATION,
        startDate: today,
        endDate: today,
        user: { team: { name: 'Platform' } },
      },
      {
        status: LeaveStatus.PENDING,
        type: LeaveType.SICK,
        startDate: '2026-03-25',
        endDate: '2026-03-25',
        user: { team: { name: 'Platform' } },
      },
      {
        status: LeaveStatus.REJECTED,
        type: LeaveType.UNPAID,
        startDate: '2026-03-30',
        endDate: '2026-03-30',
        user: { team: { name: 'Ops' } },
      },
    ] as LeaveRequest[]);

    leaveRepository.createQueryBuilder.mockReturnValue(qb as any);
    userRepository.count.mockResolvedValue(12);

    const result = await service.getLeavesSummary(
      { from: '2026-03-01', to: '2026-03-31' },
      { id: 'hr-1', role: UserRole.HR } as User,
    );

    expect(userRepository.count).toHaveBeenCalledWith();
    expect(result.totalEmployees).toBe(12);
    expect(result.activeLeavesToday).toBe(1);
    expect(result.pendingApprovals).toBe(1);
    expect(result.leavesByType).toEqual({ vacation: 1, sick: 1, unpaid: 1 });
    expect(result.leavesByTeam).toEqual(
      expect.arrayContaining([
        { teamName: 'Platform', count: 2 },
        { teamName: 'Ops', count: 1 },
      ]),
    );
  });

  it('getLeavesSummary uses team-scoped count for manager', async () => {
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue([]);
    leaveRepository.createQueryBuilder.mockReturnValue(qb as any);
    userRepository.count.mockResolvedValue(5);

    const currentUser = {
      id: 'manager-1',
      role: UserRole.MANAGER,
      teamId: 'team-1',
    } as User;

    await service.getLeavesSummary({}, currentUser);

    expect(qb.andWhere).toHaveBeenCalledWith('user.teamId = :teamId', {
      teamId: 'team-1',
    });
    expect(userRepository.count).toHaveBeenCalledWith({
      where: { teamId: 'team-1' },
    });
  });

  it('getCalendarLeaves expands approved leave days', async () => {
    const qb = makeQueryBuilder();
    qb.getMany.mockResolvedValue([
      {
        userId: 'user-1',
        startDate: '2026-03-10',
        endDate: '2026-03-12',
        user: {
          name: 'Jane',
          team: { name: 'Platform' },
        },
      },
    ] as LeaveRequest[]);

    leaveRepository.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.getCalendarLeaves(
      { from: '2026-03-01', to: '2026-03-31' },
      { id: 'hr-1', role: UserRole.HR } as User,
    );

    expect(qb.where).toHaveBeenCalledWith('leave.status = :status', {
      status: LeaveStatus.APPROVED,
    });
    expect(result.map((r) => r.date)).toEqual([
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
    ]);
    expect(result[0].leaves[0]).toEqual({
      userId: 'user-1',
      userName: 'Jane',
      teamName: 'Platform',
    });
  });
});
