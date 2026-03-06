import { ApiProperty } from '@nestjs/swagger';

export class TeamResponseDto {
  @ApiProperty({ description: 'The unique identifier of the team' })
  id: string;

  @ApiProperty({ description: 'The name of the team' })
  name: string;

  @ApiProperty({ description: 'The unique identifier of the team manager' })
  managerId: string;

  @ApiProperty({ description: 'The name of the team manager', required: false })
  managerName?: string;

  @ApiProperty({ description: 'The number of members in the team', required: false })
  membersCount?: number;
}

export class TeamMemberDto {
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'The name of the user' })
  name: string;

  @ApiProperty({ description: 'The email of the user' })
  email: string;

  @ApiProperty({ description: 'The role of the user inside the team' })
  role: string;

  @ApiProperty({ description: 'The status of the user' })
  status: string;
}