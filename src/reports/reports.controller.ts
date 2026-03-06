import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { ReportsService } from './reports.service';
import {
  ReportQueryDto,
  LeavesSummaryDto,
  CalendarQueryDto,
  CalendarLeaveDto,
} from './dto/reports.dto';
import { User, UserRole } from '../users/user.entity';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('leaves-summary')
  @Roles(UserRole.HR, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get summary of leave requests for HR/Managers' })
  @ApiOkResponse({ type: LeavesSummaryDto })
  @ApiForbiddenResponse({ description: 'Forbidden if not Manager or HR' })
  async getLeavesSummary(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: User,
  ): Promise<LeavesSummaryDto> {
    return this.reportsService.getLeavesSummary(query, user);
  }
}

@ApiTags('calendar')
@ApiBearerAuth()
@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private reportsService: ReportsService) {}

  @Get('leaves')
  @ApiOperation({ summary: 'Get calendar view of approved leaves' })
  @ApiOkResponse({ type: [CalendarLeaveDto] })
  async getCalendarLeaves(
    @Query() query: CalendarQueryDto,
    @CurrentUser() user: User,
  ): Promise<CalendarLeaveDto[]> {
    return this.reportsService.getCalendarLeaves(query, user);
  }
}