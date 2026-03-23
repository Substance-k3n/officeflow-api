import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'The name of the user' })
  name: string;

  @ApiProperty({ description: 'The email address of the user', format: 'email' })
  email: string;

  @ApiProperty({ description: 'The role of the user', enum: UserRole })
  role: string;

  @ApiProperty({ description: 'The ID of the team the user belongs to' })
  teamId: string;

  @ApiProperty({ description: 'The status of the user', enum: UserStatus })
  status: string;

  @ApiProperty({ description: 'The name of the team the user belongs to', required: false })
  teamName?: string;
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({ description: 'Filter users by team ID' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ description: 'Filter users by role', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter users by status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Search users by name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}