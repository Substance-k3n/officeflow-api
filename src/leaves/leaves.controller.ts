import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards';
import { LeavesService } from './leaves.service';
import {
  CreateLeaveDto,
  UpdateLeaveDto,
  ListLeavesQueryDto,
  LeaveResponseDto,
} from './dto/leave.dto';

@ApiTags('leaves')
@ApiBearerAuth()
@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private leavesService: LeavesService) {}

  @Get()
  @ApiOperation({ summary: 'List leave requests (filtered by query params)' })
  @ApiOkResponse({ type: [LeaveResponseDto] })
  async listLeaves(
    @Query() query: ListLeavesQueryDto,
    @Req() req,
  ): Promise<LeaveResponseDto[]> {
    return this.leavesService.findAll(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a leave request by ID' })
  @ApiOkResponse({ type: LeaveResponseDto })
  async getLeave(
    @Param('id') id: string,
    @Req() req,
  ): Promise<LeaveResponseDto> {
    return this.leavesService.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new leave request' })
  @ApiBody({ type: CreateLeaveDto })
  @ApiOkResponse({ type: LeaveResponseDto })
  async createLeave(
    @Body() createLeaveDto: CreateLeaveDto,
    @Req() req,
  ): Promise<LeaveResponseDto> {
    return this.leavesService.create(createLeaveDto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a leave request (or approve/reject if Manager)' })
  @ApiBody({ type: UpdateLeaveDto })
  @ApiOkResponse({ type: LeaveResponseDto })
  async updateLeave(
    @Param('id') id: string,
    @Body() updateLeaveDto: UpdateLeaveDto,
    @Req() req,
  ): Promise<LeaveResponseDto> {
    return this.leavesService.update(id, updateLeaveDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a leave request' })
  async deleteLeave(@Param('id') id: string, @Req() req): Promise<void> {
    return this.leavesService.delete(id, req.user);
  }
}