import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from '../websocket/websocket.guard';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/chat',
})
@UseGuards(WsGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, Set<string>> = new Map();

  constructor(private chatService: ChatService) { }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = client.data.user;
      if (!user) {
        client.disconnect(true);
        return;
      }

      const userId = user.userId;

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      console.log(`💬 Chat conectado: ${user.email} (Socket: ${client.id})`);

      client.join(`chat:${userId}`);
    } catch (error) {
      console.error('Error en chat handleConnection:', error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const user = client.data.user;
    if (user) {
      const userId = user.userId;
      const userSockets = this.connectedUsers.get(userId);

      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }

      console.log(`🚪 Chat desconectado: ${user.email} (Socket: ${client.id})`);
    }
  }

  /**
   * Handle incoming chat message
   * Saves to DB and emits to receiver in real-time
   */
  @SubscribeMessage('chat:message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string; receiverId: string },
  ): Promise<any> {
    try {
      const user = client.data.user;
      if (!user) {
        return { success: false, error: 'No autorizado' };
      }

      const message = await this.chatService.sendMessage({
        content: data.content,
        senderId: user.userId,
        receiverId: data.receiverId,
      });

      return { success: true, message };
    } catch (error) {
      console.error('Error sending chat message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get conversation history between two users
   */
  @SubscribeMessage('chat:history')
  async handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { otherUserId: string },
  ): Promise<any> {
    try {
      const user = client.data.user;
      if (!user) {
        return { success: false, error: 'No autorizado' };
      }

      const messages = await this.chatService.getConversation(
        user.userId,
        data.otherUserId,
      );

      return { success: true, messages };
    } catch (error) {
      console.error('Error getting chat history:', error);
      return { success: false, error: error.message };
    }
  }

  isUserConnected(userId: string): boolean {
    const userSockets = this.connectedUsers.get(userId);
    return userSockets !== undefined && userSockets.size > 0;
  }
}
