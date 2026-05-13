import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RoomUser {
  userId: string;
  email: string;
  name: string;
  socketId: string;
  joinedAt: Date;
}

export interface Room {
  id: string;
  users: Map<string, RoomUser>;
  createdAt: Date;
}

@Injectable()
export class RoomsService {
  private rooms: Map<string, Room> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Get or create a room by ID and sync with database
   */
  async getOrCreateRoom(roomId: string): Promise<Room> {
    if (!this.rooms.has(roomId)) {
      // Initialize empty room
      this.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        createdAt: new Date(),
      });

      // Sync with database participants if room exists in DB
      try {
        const dbRoom = await this.prisma.room.findUnique({
          where: { id: roomId },
          include: { participants: true },
        });

        if (dbRoom && dbRoom.participants.length > 0) {
          console.log(`🔄 Sincronizando sala ${roomId} con ${dbRoom.participants.length} participantes de BD`);
          // Note: We're not adding users to the in-memory list here because they might not be actually connected
          // The actual user connection will add them when they join
        }
      } catch (error) {
        console.error('Error sincronizando sala con BD:', error);
      }
    }
    return this.rooms.get(roomId)!;
  }

  /**
   * Get a room by ID (returns undefined if not exists)
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Add a user to a room (in-memory + persist to DB)
   */
  async addUserToRoom(roomId: string, user: RoomUser): Promise<Room> {
    const room = await this.getOrCreateRoom(roomId);
    room.users.set(user.userId, user);

    // Persist to database
    try {
      await this.prisma.roomParticipant.upsert({
        where: { userId_roomId: { userId: user.userId, roomId } },
        update: { joinedAt: new Date() },
        create: { userId: user.userId, roomId, joinedAt: new Date() },
      });
    } catch (error) {
      console.error('Error saving room participant:', error);
    }

    return room;
  }

  /**
   * Remove a user from a room
   */
  async removeUserFromRoom(roomId: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const removed = room.users.delete(userId);

    // Clean up empty rooms and mark as inactive in DB
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      await this.prisma.room.update({
        where: { id: roomId },
        data: { isActive: false },
      });
    }

    return removed;
  }

  /**
   * Get all users in a room
   */
  getRoomUsers(roomId: string): RoomUser[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.users.values());
  }

  /**
   * Get all rooms a user is in
   */
  getUserRooms(userId: string): string[] {
    const userRooms: string[] = [];
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.has(userId)) {
        userRooms.push(roomId);
      }
    }
    return userRooms;
  }

  /**
   * Remove a user from all rooms (on disconnect)
   */
  async removeUserFromAllRooms(userId: string): Promise<string[]> {
    const leftRooms: string[] = [];
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.has(userId)) {
        room.users.delete(userId);
        leftRooms.push(roomId);
        if (room.users.size === 0) {
          this.rooms.delete(roomId);
          await this.prisma.room.update({
            where: { id: roomId },
            data: { isActive: false },
          });
        }
      }
    }
    return leftRooms;
  }

  /**
   * Get room statistics
   */
  getStats(): { totalRooms: number; totalUsers: number } {
    let totalUsers = 0;
    for (const room of this.rooms.values()) {
      totalUsers += room.users.size;
    }
    return {
      totalRooms: this.rooms.size,
      totalUsers,
    };
  }

  /**
   * Get all active rooms (in-memory rooms with users)
   */
  async getAllRooms(): Promise<{ id: string; name: string; area: string; userCount: number; createdAt: Date }[]> {
    const activeRooms: { id: string; name: string; area: string; userCount: number; createdAt: Date }[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.size > 0) {
        const dbRoom = await this.prisma.room.findUnique({
          where: { id: roomId },
          select: { name: true, area: true },
        });

        if (dbRoom) {
          activeRooms.push({
            id: roomId,
            name: dbRoom.name,
            area: dbRoom.area,
            userCount: room.users.size,
            createdAt: room.createdAt,
          });
        }
      }
    }
    return activeRooms;
  }

  /**
   * Get all rooms for a user (created + participated)
   */
  async getUserRoomsWithDetails(userId: string): Promise<{ id: string; name: string; area: string; hostId: string; userCount: number; createdAt: Date; isCreator: boolean }[]> {
    const rooms = await this.prisma.room.findMany({
      where: {
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        area: true,
        hostId: true,
        createdAt: true,
        participants: { select: { userId: true } },
      },
    });

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      area: room.area,
      hostId: room.hostId,
      createdAt: room.createdAt,
      userCount: this.rooms.get(room.id)?.users.size ?? 0,
      isCreator: room.hostId === userId,
    }));
  }

  /**
   * Create a room (persist to DB and in-memory)
   */
  async createRoom(name: string, area: string, hostId: string) {
    try {
      const dbRoom = await this.prisma.room.create({
        data: {
          name,
          area: area as any,
          hostId,
          isActive: true,
        },
      });

      this.getOrCreateRoom(dbRoom.id);
      console.log(`✅ Sala creada en BD: ${dbRoom.name} (${dbRoom.id})`);

      return {
        id: dbRoom.id,
        name: dbRoom.name,
        area: dbRoom.area,
        hostId: dbRoom.hostId,
        isActive: dbRoom.isActive,
        createdAt: dbRoom.createdAt,
        userCount: 0,
      };
    } catch (error) {
      console.error('❌ Error creando sala:', error);
      throw error;
    }
  }
}
