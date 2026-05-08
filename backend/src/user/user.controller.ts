import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('search')
  async search(@Query('q') q: string) {
    return this.userService.searchAll(q || '');
  }

  @Get(':id')
  async getProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getProfile(id);
  }

  @Post(':id/follow')
  async toggleFollow(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const followerId = req.user.userId;
    return this.userService.toggleFollow(id, followerId);
  }

  @Get(':id/followers')
  async getFollowers(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getFollowers(id);
  }

  @Get(':id/following')
  async getFollowing(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getFollowing(id);
  }

  @Get(':id/is-following/:targetId')
  async isFollowing(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('targetId', ParseUUIDPipe) targetId: string,
  ) {
    const following = await this.userService.isFollowing(id, targetId);
    return { following };
  }
}
