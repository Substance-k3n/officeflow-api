import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { UsersService } from './users.service';
import { ListUsersQueryDto, UserResponseDto } from './dto/user.dto';
import { User } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.findMe(user.id);
  }

  @Get()
  async listUsers(
    @Query() query: ListUsersQueryDto,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto[]> {
    return this.usersService.findAll(query, user);
  }
}