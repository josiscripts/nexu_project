import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Create a new notification and emit it via WebSocket
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    // Verify recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Usuario destinatario no encontrado');
    }

    // Create notification in database
    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        message: dto.message,
        recipientId: dto.recipientId,
        postId: dto.postId,
      },
      include: {
        recipient: {
          select: { id: true, name: true, email: true },
        },
        post: dto.postId
          ? {
              select: { id: true, content: true },
            }
          : false,
      },
    });

    // Emit real-time notification if user is connected
    if (this.websocketGateway.isUserConnected(dto.recipientId)) {
      this.websocketGateway.emitToUser(dto.recipientId, 'new-notification', {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        createdAt: notification.createdAt,
        read: notification.read,
      });
    }

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          select: { id: true, content: true },
        },
      },
    });
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });
  }

  /**
   * Get a specific notification by ID
   */
  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        recipient: { select: { id: true } },
        post: { select: { id: true, content: true } },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    if (notification.recipientId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta notificación');
    }

    return notification;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        read: false,
      },
      data: { read: true },
    });

    // Emit update via WebSocket
    if (this.websocketGateway.isUserConnected(userId)) {
      this.websocketGateway.emitToUser(userId, 'notification:allRead', {
        count: result.count,
      });
    }

    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  async remove(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    return this.prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Create notification helper for post creation
   */
  async notifyPostCreated(
    authorId: string,
    authorName: string,
    postContent: string,
    authorArea: string,
  ): Promise<void> {
    // Create notification for the post author (system notification)
    await this.create({
      type: NotificationType.POST_CREATED,
      message: `Tu publicación ha sido creada exitosamente.`,
      recipientId: authorId,
    });

    // Note: To notify other users in the same area, you would need to
    // query users by area and create notifications for each
    // This is a simplified version
  }

  /**
   * Create notification for mentions
   */
  async notifyMention(
    mentionedUserId: string,
    mentionedByName: string,
    postId: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.MENTION,
      message: `${mentionedByName} te mencionó en una publicación.`,
      recipientId: mentionedUserId,
      postId,
    });
  }
}