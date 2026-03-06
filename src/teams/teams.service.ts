import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';
import { User, UserRole } from '../users/user.entity';
import { TeamResponseDto, TeamMemberDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

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