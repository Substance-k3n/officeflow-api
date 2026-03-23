import { CalendarController, ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let reportsController: ReportsController;
  let calendarController: CalendarController;
  let reportsService: jest.Mocked<ReportsService>;

  beforeEach(() => {
    reportsService = {
      getLeavesSummary: jest.fn(),
      getCalendarLeaves: jest.fn(),
    } as unknown as jest.Mocked<ReportsService>;

    reportsController = new ReportsController(reportsService);
    calendarController = new CalendarController(reportsService);
  });

  it('getLeavesSummary delegates query and user', async () => {
    reportsService.getLeavesSummary.mockResolvedValue({
      totalEmployees: 10,
      activeLeavesToday: 2,
      pendingApprovals: 1,
      leavesByType: { vacation: 1, sick: 1, unpaid: 0 },
      leavesByTeam: [{ teamName: 'Platform', count: 2 }],
    });

    const query = { from: '2026-03-01', to: '2026-03-31' };
    const user = { id: 'hr-1', role: 'hr' } as any;

    const result = await reportsController.getLeavesSummary(query as any, user);

    expect(reportsService.getLeavesSummary).toHaveBeenCalledWith(query, user);
    expect(result.totalEmployees).toBe(10);
  });

  it('getCalendarLeaves delegates query and user', async () => {
    reportsService.getCalendarLeaves.mockResolvedValue([
      {
        date: '2026-03-15',
        leaves: [{ userId: 'user-1', userName: 'Jane', teamName: 'Platform' }],
      },
    ]);

    const query = { teamId: 'team-1' };
    const user = { id: 'manager-1', role: 'manager' } as any;

    const result = await calendarController.getCalendarLeaves(query as any, user);

    expect(reportsService.getCalendarLeaves).toHaveBeenCalledWith(query, user);
    expect(result).toHaveLength(1);
  });
});
