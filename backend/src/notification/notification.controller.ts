import {
  Controller,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get all notifications for the authenticated user
   */
  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user.userId;
    return this.notificationService.findAllForUser(userId);
  }

  /**
   * Get unread notifications count
   */
  @Get('unread/count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.userId;
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  /**
   * Get a specific notification
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.notificationService.findOne(id, userId);
  }

  /**
   * Mark a notification as read
   */
  @Put(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.notificationService.markAsRead(id, userId);
  }

  /**
   * Mark all notifications as read
   */
  @Put('read/all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.userId;
    return this.notificationService.markAllAsRead(userId);
  }

  /**
   * Delete a notification
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.notificationService.remove(id, userId);
  }
}