import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

export interface ChatMessageDto {
  content: string;
  senderId: string;
  receiverId: string;
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Send a chat message: save to DB and emit via WebSocket
   */
  async sendMessage(dto: ChatMessageDto) {
    // Verify sender and receiver exist
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.senderId } }),
      this.prisma.user.findUnique({ where: { id: dto.receiverId } }),
    ]);

    if (!sender) {
      throw new NotFoundException('Usuario remitente no encontrado');
    }

    if (!receiver) {
      throw new NotFoundException('Usuario destinatario no encontrado');
    }

    // Save message to database
    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
        senderId: dto.senderId,
        receiverId: dto.receiverId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Emit real-time notification to receiver if connected
    if (this.websocketGateway.isUserConnected(dto.receiverId)) {
      this.websocketGateway.emitToUser(dto.receiverId, 'chat:message', {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          email: message.sender.email,
        },
      });
    }

    return message;
  }

  /**
   * Get conversation between two users
   */
  async getConversation(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Get recent conversations for a user
   */
  async getRecentConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
      take: 50,
    });

    // Group by conversation partner
    const conversations = new Map<string, any[]>();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, []);
      }
      conversations.get(partnerId)!.push(msg);
    }

    return Array.from(conversations.entries()).map(([partnerId, msgs]) => ({
      partnerId,
      lastMessage: msgs[0],
      unreadCount: msgs.filter(
        (m) => m.receiverId === userId && !m.read,
      ).length,
    }));
  }
}
