import { IsOptional, IsDateString, IsString } from 'class-validator';

export class ReportQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class LeavesSummaryDto {
  totalEmployees: number;
  activeLeavesToday: number;
  pendingApprovals: number;
  leavesByType: {
    vacation: number;
    sick: number;
    unpaid: number;
  };
  leavesByTeam: Array<{
    teamName: string;
    count: number;
  }>;
}

export class CalendarQueryDto {
  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CalendarLeaveDto {
  date: string;
  leaves: Array<{
    userId: string;
    userName: string;
    teamName: string;
  }>;
}