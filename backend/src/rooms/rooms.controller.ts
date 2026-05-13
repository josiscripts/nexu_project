import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly prisma: PrismaService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  @Get()
  async findAll() {
    return await this.roomsService.getAllRooms();
  }

  @Get('my-rooms')
  async getMyRooms(@Request() req: any) {
    const userId = req.user.userId;
    return await this.roomsService.getUserRoomsWithDetails(userId);
  }

  @Post()
  async create(
    @Body() dto: { name: string; area: string },
    @Request() req: any,
  ) {
    try {
      const userId = req.user.userId;
      const newRoom = await this.roomsService.createRoom(dto.name, dto.area, userId);

      this.websocketGateway.emitToArea(
        dto.area as any,
        'room:created',
        {
          roomId: newRoom.id,
          roomName: newRoom.name,
          area: newRoom.area,
          hostId: newRoom.hostId,
          createdAt: newRoom.createdAt,
        },
      );

      this.websocketGateway.emitToAll('room:list-update', {
        roomId: newRoom.id,
        roomName: newRoom.name,
        area: newRoom.area,
      });

      return newRoom;
    } catch (error) {
      console.error('❌ Error en POST /rooms:', error);
      throw error;
    }
  }

  @Get(':id/users')
  async getRoomUsers(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.getRoomUsers(id);
  }

  @Get(':id/participants')
  async getParticipants(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const participants = await this.prisma.roomParticipant.findMany({
        where: { roomId: id },
        select: {
          userId: true,
          roomId: true,
          joinedAt: true,
        },
        orderBy: { joinedAt: 'asc' },
      });

      return {
        roomId: id,
        participants,
        totalUsers: participants.length,
      };
    } catch (error) {
      console.error(`❌ Error fetching participants for room ${id}:`, error);
      throw new HttpException(
        'Error fetching participants',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/join')
  async joinRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }

    if (!room.isActive) {
      throw new HttpException('Room is no longer active', HttpStatus.GONE);
    }

    // Add user to room participant in database
    try {
      await this.prisma.roomParticipant.upsert({
        where: { userId_roomId: { userId, roomId: id } },
        update: { joinedAt: new Date() },
        create: { userId, roomId: id, joinedAt: new Date() },
      });
    } catch (error) {
      console.error('Error adding room participant:', error);
    }

    const roomUsers = this.roomsService.getRoomUsers(id);
    return {
      roomId: id,
      roomName: room.name,
      area: room.area,
      users: roomUsers.map(({ userId, email, name, joinedAt }) => ({
        userId,
        email,
        name,
        joinedAt,
      })),
      userCount: roomUsers.length,
    };
  }

  @Post(':id/leave')
  async leaveRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { userId: string },
  ) {
    try {
      await this.prisma.roomParticipant.delete({
        where: {
          userId_roomId: {
            userId: body.userId,
            roomId: id,
          },
        },
      });

      console.log(`✅ [RoomsController] Participante ${body.userId} eliminado de sala ${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error leaving room:', error);
      throw new HttpException('Error leaving room', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId;

    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }

    // Only room creator can delete
    if (room.hostId !== userId) {
      throw new HttpException('Only the room creator can delete this room', HttpStatus.FORBIDDEN);
    }

    try {
      // Delete room (cascades to RoomParticipant)
      await this.prisma.room.delete({
        where: { id },
      });

      // Emit delete event
      this.websocketGateway.emitToAll('room:destroyed', {
        roomId: id,
        roomName: room.name,
      });

      return { success: true, message: 'Room deleted successfully' };
    } catch (error) {
      console.error('Error deleting room:', error);
      throw new HttpException('Error deleting room', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
