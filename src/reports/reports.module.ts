import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController, CalendarController } from './reports.controller';
import { ReportsService } from './reports.service';
import { LeaveRequest } from '../leaves/leave-request.entity';
import { User } from '../users/user.entity';
import { Team } from '../teams/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequest, User, Team])],
  controllers: [ReportsController, CalendarController],
  providers: [ReportsService],
})
export class ReportsModule {}
