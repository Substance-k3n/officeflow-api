export class TeamResponseDto {
  id: string;
  name: string;
  managerId: string;
  managerName?: string;
  membersCount?: number;
}

export class TeamMemberDto {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}