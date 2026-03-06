import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest, LeaveStatus, LeaveType } from '../leaves/leave-request.entity';
import { User, UserRole } from '../users/user.entity';
import { Team } from '../teams/team.entity';
import {
  ReportQueryDto,
  LeavesSummaryDto,
  CalendarQueryDto,
  CalendarLeaveDto,
} from './dto/reports.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRepository: Repository<LeaveRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
  ) {}

  async getLeavesSummary(
    query: ReportQueryDto,
    currentUser: User,
  ): Promise<LeavesSummaryDto> {
    const queryBuilder = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.user', 'user')
      .leftJoinAndSelect('user.team', 'team');

    if (currentUser.role === UserRole.MANAGER) {
      queryBuilder.andWhere('user.teamId = :teamId', {
        teamId: currentUser.teamId,
      });
    }

    if (query.from && query.to) {
      queryBuilder.andWhere('leave.startDate <= :to', { to: query.to });
      queryBuilder.andWhere('leave.endDate >= :from', { from: query.from });
    } else if (query.from) {
      queryBuilder.andWhere('leave.endDate >= :from', { from: query.from });
    } else if (query.to) {
      queryBuilder.andWhere('leave.startDate <= :to', { to: query.to });
    }

    const allLeaves = await queryBuilder.getMany();

    let totalEmployees = 0;
    if (currentUser.role === UserRole.HR) {
      totalEmployees = await this.userRepository.count();
    } else {
      totalEmployees = await this.userRepository.count({
        where: { teamId: currentUser.teamId },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const activeLeavesToday = allLeaves.filter(
      (leave) =>
        leave.status === LeaveStatus.APPROVED &&
        leave.startDate <= today &&
        leave.endDate >= today,
    ).length;

    const pendingApprovals = allLeaves.filter(
      (leave) => leave.status === LeaveStatus.PENDING,
    ).length;

    const leavesByType = {
      vacation: allLeaves.filter((l) => l.type === LeaveType.VACATION).length,
      sick: allLeaves.filter((l) => l.type === LeaveType.SICK).length,
      unpaid: allLeaves.filter((l) => l.type === LeaveType.UNPAID).length,
    };

    const teamCounts = new Map<string, number>();
    allLeaves.forEach((leave) => {
      const teamName = leave.user?.team?.name || 'Unknown';
      teamCounts.set(teamName, (teamCounts.get(teamName) || 0) + 1);
    });

    const leavesByTeam = Array.from(teamCounts.entries()).map(
      ([teamName, count]) => ({
        teamName,
        count,
      }),
    );

    return {
      totalEmployees,
      activeLeavesToday,
      pendingApprovals,
      leavesByType,
      leavesByTeam,
    };
  }

  async getCalendarLeaves(
    query: CalendarQueryDto,
    currentUser: User,
  ): Promise<CalendarLeaveDto[]> {
    const queryBuilder = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.user', 'user')
      .leftJoinAndSelect('user.team', 'team')
      .where('leave.status = :status', { status: LeaveStatus.APPROVED });

    if (currentUser.role === UserRole.MANAGER && !query.teamId) {
      queryBuilder.andWhere('user.teamId = :teamId', {
        teamId: currentUser.teamId,
      });
    } else if (query.teamId) {
      queryBuilder.andWhere('user.teamId = :teamId', { teamId: query.teamId });
    }

    if (query.from && query.to) {
      queryBuilder.andWhere('leave.startDate <= :to', { to: query.to });
      queryBuilder.andWhere('leave.endDate >= :from', { from: query.from });
    } else if (query.from) {
      queryBuilder.andWhere('leave.endDate >= :from', { from: query.from });
    } else if (query.to) {
      queryBuilder.andWhere('leave.startDate <= :to', { to: query.to });
    }

    const leaves = await queryBuilder.getMany();

    const dateMap = new Map<string, any[]>();

    leaves.forEach((leave) => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split('T')[0];

        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, []);
        }

        dateMap.get(dateStr).push({
          userId: leave.userId,
          userName: leave.user?.name || '',
          teamName: leave.user?.team?.name || '',
        });
      }
    });

    const result: CalendarLeaveDto[] = Array.from(dateMap.entries())
      .map(([date, leaves]) => ({ date, leaves }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }
}