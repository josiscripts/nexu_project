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
import { UseGuards, Inject } from '@nestjs/common';
import { WsGuard } from '../websocket/websocket.guard';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/rooms',
})
@UseGuards(WsGuard)
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private roomsService: RoomsService,
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const user = client.data.user;
    if (!user) {
      client.disconnect(true);
      return;
    }

    // Join personal room for WebRTC signaling to work
    client.join(`user:${user.userId}`);

    console.log(`🎙️ Room connection: ${user.email} (${client.id})`);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const user = client.data.user;
    if (user) {
      const userId = user.userId;

      // Remove user from all rooms and get list of rooms they left
      const leftRooms = await this.roomsService.removeUserFromAllRooms(userId);

      // Notify each room that the user left
      for (const roomId of leftRooms) {
        this.server.to(roomId).emit('user-left', {
          userId,
          email: user.email,
          name: user.name,
          roomId,
        });
      }

      console.log(`🎙️ Room disconnection: ${user.email} (${client.id})`);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const user = client.data.user;
    if (!user) return;

    const { roomId } = data;

    // Join the Socket.io room
    client.join(roomId);

    // Add user to room in service
    const room = this.roomsService.addUserToRoom(roomId, {
      userId: user.userId,
      email: user.email,
      name: user.name,
      socketId: client.id,
      joinedAt: new Date(),
    });

    // Get other users in the room
    const otherUsers = Array.from(room.users.values())
      .filter((u) => u.userId !== user.userId)
      .map((u) => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
      }));

    // Send confirmation to the user who joined
    client.emit('room-joined', {
      roomId,
      users: otherUsers,
    });

    // Notify others in the room that a new user joined
    client.to(roomId).emit('user-joined', {
      userId: user.userId,
      email: user.email,
      name: user.name,
      roomId,
    });

    // Get room info from DB to get area
    const dbRoom = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (dbRoom) {
      this.websocketGateway.emitToArea(dbRoom.area, 'room:user-joined', {
        roomId,
        roomName: dbRoom.name,
        userId: user.userId,
        userCount: room.users.size,
      });
    }

    console.log(`🎙️ ${user.email} joined room: ${roomId}`);
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const user = client.data.user;
    if (!user) return;

    const { roomId } = data;

    // Get room info before removal
    const dbRoom = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    // Leave the Socket.io room
    client.leave(roomId);

    // Remove user from room in service
    await this.roomsService.removeUserFromRoom(roomId, user.userId);

    // Notify others in the room that the user left
    client.to(roomId).emit('user-left', {
      userId: user.userId,
      email: user.email,
      name: user.name,
      roomId,
    });

    // Send confirmation to the user who left
    client.emit('room-left', { roomId });

    // Emit area event
    if (dbRoom) {
      const room = this.roomsService.getRoom(roomId);
      const userCount = room?.users.size ?? 0;

      if (userCount === 0) {
        this.websocketGateway.emitToArea(dbRoom.area, 'room:destroyed', {
          roomId,
          roomName: dbRoom.name,
        });
      } else {
        this.websocketGateway.emitToArea(dbRoom.area, 'room:user-left', {
          roomId,
          roomName: dbRoom.name,
          userId: user.userId,
          userCount,
        });
      }
    }

    console.log(`🎙️ ${user.email} left room: ${roomId}`);
  }

  @SubscribeMessage('get-room-users')
  handleGetRoomUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): any[] {
    const users = this.roomsService.getRoomUsers(data.roomId);
    return users.map(({ userId, email, name, joinedAt }) => ({
      userId,
      email,
      name,
      joinedAt,
    }));
  }

  // WebRTC Signaling - Offer
  @SubscribeMessage('webrtc:offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; offer: RTCSessionDescriptionInit },
  ): void {
    const user = client.data.user;
    if (!user) return;

    console.log(`Forwarding offer to ${data.targetUserId}`);
    this.server.to(`user:${data.targetUserId}`).emit('webrtc:offer', {
      fromUserId: user.userId,
      offer: data.offer,
    });
  }

  // WebRTC Signaling - Answer
  @SubscribeMessage('webrtc:answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; answer: RTCSessionDescriptionInit },
  ): void {
    const user = client.data.user;
    if (!user) return;

    console.log(`Forwarding answer to ${data.targetUserId}`);
    this.server.to(`user:${data.targetUserId}`).emit('webrtc:answer', {
      fromUserId: user.userId,
      answer: data.answer,
    });
  }

  // WebRTC Signaling - ICE Candidate
  @SubscribeMessage('webrtc:ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string; candidate: RTCIceCandidateInit },
  ): void {
    const user = client.data.user;
    if (!user) return;

    console.log(`Forwarding ice-candidate to ${data.targetUserId}`);
    this.server.to(`user:${data.targetUserId}`).emit('webrtc:ice-candidate', {
      fromUserId: user.userId,
      candidate: data.candidate,
    });
  }
}
