import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportQueryDto {
  @ApiProperty({ required: false, description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false, description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class LeavesByTypeDto {
  @ApiProperty()
  vacation: number;

  @ApiProperty()
  sick: number;

  @ApiProperty()
  unpaid: number;
}

export class LeavesByTeamDto {
  @ApiProperty()
  teamName: string;

  @ApiProperty()
  count: number;
}

export class LeavesSummaryDto {
  @ApiProperty()
  totalEmployees: number;

  @ApiProperty()
  activeLeavesToday: number;

  @ApiProperty()
  pendingApprovals: number;

  @ApiProperty({ type: LeavesByTypeDto })
  leavesByType: LeavesByTypeDto;

  @ApiProperty({ type: [LeavesByTeamDto] })
  leavesByTeam: LeavesByTeamDto[];
}

export class CalendarQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiProperty({ required: false, description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false, description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CalendarLeaveUserDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  teamName: string;
}

export class CalendarLeaveDto {
  @ApiProperty()
  date: string;

  @ApiProperty({ type: [CalendarLeaveUserDto] })
  leaves: CalendarLeaveUserDto[];
}