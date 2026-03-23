import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { UsersService } from './users.service';
import { ListUsersQueryDto, UserResponseDto } from './dto/user.dto';
import { User } from './user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.usersService.findMe(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all users (with optional filtering)' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async listUsers(
    @Query() query: ListUsersQueryDto,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto[]> {
    return this.usersService.findAll(query, user);
  }
}