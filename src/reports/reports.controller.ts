import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { ReportsService } from './reports.service';
import {
  ReportQueryDto,
  LeavesSummaryDto,
  CalendarQueryDto,
  CalendarLeaveDto,
} from './dto/reports.dto';
import { User, UserRole } from '../entities/user.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('leaves-summary')
  @Roles(UserRole.HR, UserRole.MANAGER)
  async getLeavesSummary(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: User,
  ): Promise<LeavesSummaryDto> {
    return this.reportsService.getLeavesSummary(query, user);
  }
}

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private reportsService: ReportsService) {}

  @Get('leaves')
  async getCalendarLeaves(
    @Query() query: CalendarQueryDto,
    @CurrentUser() user: User,
  ): Promise<CalendarLeaveDto[]> {
    return this.reportsService.getCalendarLeaves(query, user);
  }
}