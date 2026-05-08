import {
  Controller,
  Get,
  Post,
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

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll() {
    return this.roomsService.getAllRooms();
  }

  @Post()
  async create(
    @Body() dto: { name: string; area: string },
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.roomsService.createRoom(dto.name, dto.area, userId);
  }

  @Get(':id/users')
  async getRoomUsers(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.getRoomUsers(id);
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
}
