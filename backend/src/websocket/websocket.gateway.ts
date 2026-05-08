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
import { WsGuard } from './websocket.guard';
import { UnescoArea } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/notifications',
})
@UseGuards(WsGuard)
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected users with their socket IDs
  private connectedUsers: Map<string, Set<string>> = new Map();

  constructor() {}

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = client.data.user;
      if (!user) {
        client.disconnect(true);
        return;
      }

      const userId = user.userId;

      // Track this socket for the user
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      console.log(`✅ Usuario conectado: ${user.email} (Socket: ${client.id})`);

      // Join user to their personal room
      client.join(`user:${userId}`);
    } catch (error) {
      console.error('Error en handleConnection:', error);
      client.disconnect(true);
    }
  }

  /**
   * Handle WebSocket disconnection
   */
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

      console.log(`❌ Usuario desconectado: ${user.email} (Socket: ${client.id})`);
    }
  }

  /**
   * Join a UNESCO area room for area-specific notifications
   */
  @SubscribeMessage('joinArea')
  handleJoinArea(
    @ConnectedSocket() client: Socket,
    @MessageBody() area: UnescoArea,
  ): void {
    client.join(`area:${area}`);
    console.log(`📡 Usuario ${client.data.user.email} se unió al área: ${area}`);
  }

  /**
   * Leave a UNESCO area room
   */
  @SubscribeMessage('leaveArea')
  handleLeaveArea(
    @ConnectedSocket() client: Socket,
    @MessageBody() area: UnescoArea,
  ): void {
    client.leave(`area:${area}`);
    console.log(`🚪 Usuario ${client.data.user.email} salió del área: ${area}`);
  }

  /**
   * Emit notification to a specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit notification to all users in a UNESCO area
   */
  emitToArea(area: UnescoArea, event: string, data: any): void {
    this.server.to(`area:${area}`).emit(event, data);
  }

  /**
   * Emit notification to all connected users
   */
  emitToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }

  /**
   * Check if a user is currently connected
   */
  isUserConnected(userId: string): boolean {
    const userSockets = this.connectedUsers.get(userId);
    return userSockets !== undefined && userSockets.size > 0;
  }

  /**
   * Get count of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}