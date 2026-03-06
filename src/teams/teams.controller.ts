import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { TeamsService } from './teams.service';
import { TeamResponseDto, TeamMemberDto } from './dto/team.dto';
import { User, UserRole } from '../users/user.entity';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'List all teams' })
  @ApiOkResponse({
    description: 'List of all teams',
    type: [TeamResponseDto],
  })
  async listTeams(): Promise<TeamResponseDto[]> {
    return this.teamsService.findAll();
  }

  @Get(':id/members')
  @Roles(UserRole.MANAGER, UserRole.HR)
  @ApiOperation({ summary: 'Get members of a specific team (Manager/HR only)' })
  @ApiOkResponse({
    description: 'List of team members',
    type: [TeamMemberDto],
  })
  @ApiForbiddenResponse({ description: 'Forbidden if not Manager or HR' })
  async getTeamMembers(
    @Param('id') teamId: string,
    @CurrentUser() user: User,
  ): Promise<TeamMemberDto[]> {
    return this.teamsService.findTeamMembers(teamId, user);
  }
}