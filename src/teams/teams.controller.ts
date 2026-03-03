import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { TeamsService } from './teams.service';
import { TeamResponseDto, TeamMemberDto } from './dto/team.dto';
import { User, UserRole } from '../entities/user.entity';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  async listTeams(): Promise<TeamResponseDto[]> {
    return this.teamsService.findAll();
  }

  @Get(':id/members')
  @Roles(UserRole.MANAGER, UserRole.HR)
  async getTeamMembers(
    @Param('id') teamId: string,
    @CurrentUser() user: User,
  ): Promise<TeamMemberDto[]> {
    return this.teamsService.findTeamMembers(teamId, user);
  }
}