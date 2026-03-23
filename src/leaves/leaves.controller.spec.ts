import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { LeaveStatus, LeaveType } from './leave-request.entity';

describe('LeavesController', () => {
  let controller: LeavesController;
  let leavesService: jest.Mocked<LeavesService>;

  beforeEach(() => {
    leavesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<LeavesService>;

    controller = new LeavesController(leavesService);
  });

  it('listLeaves delegates query and user', async () => {
    leavesService.findAll.mockResolvedValue([]);

    const query = { status: LeaveStatus.PENDING };
    const req = { user: { id: 'user-1' } };

    const result = await controller.listLeaves(query as any, req as any);

    expect(leavesService.findAll).toHaveBeenCalledWith(query, req.user);
    expect(result).toEqual([]);
  });

  it('getLeave delegates id and user', async () => {
    leavesService.findOne.mockResolvedValue({ id: 'leave-1' } as any);

    const req = { user: { id: 'user-1' } };
    const result = await controller.getLeave('leave-1', req as any);

    expect(leavesService.findOne).toHaveBeenCalledWith('leave-1', req.user);
    expect(result.id).toBe('leave-1');
  });

  it('createLeave delegates dto and user', async () => {
    leavesService.create.mockResolvedValue({ id: 'leave-2' } as any);

    const dto = {
      type: LeaveType.VACATION,
      startDate: '2026-04-10',
      endDate: '2026-04-11',
      reason: 'Trip',
    };
    const req = { user: { id: 'user-1' } };

    const result = await controller.createLeave(dto as any, req as any);

    expect(leavesService.create).toHaveBeenCalledWith(dto, req.user);
    expect(result.id).toBe('leave-2');
  });

  it('updateLeave delegates id dto and user', async () => {
    leavesService.update.mockResolvedValue({ id: 'leave-3' } as any);

    const dto = { status: LeaveStatus.APPROVED };
    const req = { user: { id: 'manager-1' } };

    const result = await controller.updateLeave('leave-3', dto as any, req as any);

    expect(leavesService.update).toHaveBeenCalledWith('leave-3', dto, req.user);
    expect(result.id).toBe('leave-3');
  });

  it('deleteLeave delegates id and user', async () => {
    leavesService.delete.mockResolvedValue(undefined);

    const req = { user: { id: 'user-1' } };
    await controller.deleteLeave('leave-4', req as any);

    expect(leavesService.delete).toHaveBeenCalledWith('leave-4', req.user);
  });
});
