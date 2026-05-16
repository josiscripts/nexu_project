import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(@Body() dto: CreateGroupDto, @Request() req: any) {
    const hostId = req.user.userId;
    return this.groupsService.create(dto, hostId);
  }

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user.userId;
    return this.groupsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.groupsService.findOne(id);
  }

  @Post(':id/join')
  async join(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const userId = req.user.userId;
    return this.groupsService.join(id, userId);
  }

  @Delete(':id/leave')
  async leave(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const userId = req.user.userId;
    return this.groupsService.leave(id, userId);
  }

  @Post(':groupId/posts')
  async createPost(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreatePostDto,
    @Request() req: any,
  ) {
    const authorId = req.user.userId;
    return this.groupsService.createPost(groupId, authorId, dto);
  }

  @Get(':groupId/posts')
  async getGroupPosts(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.groupsService.getGroupPosts(groupId);
  }

  @Delete(':groupId/posts/:postId')
  async deletePost(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.groupsService.deletePost(postId, groupId, userId);
  }
}
