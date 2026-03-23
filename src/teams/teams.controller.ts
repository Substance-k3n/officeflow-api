import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiForbiddenResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { TeamsService } from './teams.service';
import { TeamResponseDto, TeamMemberDto, CreateTeamDto } from './dto/team.dto';
import { User, UserRole } from '../users/user.entity';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  @Roles(UserRole.HR)
  @ApiOperation({ summary: 'Create a new team (HR only)' })
  @ApiBody({ type: CreateTeamDto })
  @ApiOkResponse({
    description: 'The created team',
    type: TeamResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden if not HR' })
  async createTeam(@Body() createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
    return this.teamsService.create(createTeamDto);
  }

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