import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserRole } from './user.entity';
import { ListUsersQueryDto, UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    return this.mapToResponseDto(user);
  }

  async findAll(
    query: ListUsersQueryDto,
    currentUser: User,
  ): Promise<UserResponseDto[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.team', 'team');

    if (currentUser.role === UserRole.MANAGER) {
      queryBuilder.andWhere('user.teamId = :teamId', {
        teamId: currentUser.teamId,
      });
    } else if (currentUser.role === UserRole.EMPLOYEE) {
      queryBuilder.andWhere('user.teamId = :teamId', {
        teamId: currentUser.teamId,
      });
    }

    if (query.teamId) {
      queryBuilder.andWhere('user.teamId = :teamId', { teamId: query.teamId });
    }

    if (query.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    if (query.status) {
      queryBuilder.andWhere('user.status = :status', { status: query.status });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const users = await queryBuilder.getMany();
    return users.map((user) => this.mapToResponseDto(user));
  }

  private mapToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
      status: user.status,
      teamName: user.team?.name,
    };
  }
}