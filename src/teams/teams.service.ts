import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';
import { User, UserRole } from '../users/user.entity';
import { TeamResponseDto, TeamMemberDto, CreateTeamDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
    const { name, managerId } = createTeamDto;

    const existingTeam = await this.teamRepository.findOne({ where: { name } });
    if (existingTeam) {
      throw new BadRequestException('Team with this name already exists');
    }

    const team = this.teamRepository.create({ name });

    if (managerId) {
      const manager = await this.userRepository.findOne({
        where: { id: managerId },
      });
      if (!manager) {
        throw new NotFoundException('Manager not found');
      }
      if (manager.role !== UserRole.MANAGER) {
        throw new BadRequestException('The selected user is not a manager');
      }
      team.manager = manager;
    }

    await this.teamRepository.save(team);

    return {
      id: team.id,
      name: team.name,
      managerId: team.manager?.id,
      managerName: team.manager?.name,
      membersCount: 0,
    };
  }

  async findAll(): Promise<TeamResponseDto[]> {
    const teams = await this.teamRepository.find({
      relations: ['manager', 'members'],
    });

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      managerId: team.managerId,
      managerName: team.manager?.name,
      membersCount: team.members?.length || 0,
    }));
  }

  async findTeamMembers(
    teamId: string,
    currentUser: User,
  ): Promise<TeamMemberDto[]> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['members'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (currentUser.role === UserRole.MANAGER) {
      if (team.managerId !== currentUser.id) {
        throw new ForbiddenException(
          'Managers can only view their own team members',
        );
      }
    }

    return team.members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
    }));
  }
}