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
   * Get or create a room by ID
   */
  getOrCreateRoom(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        createdAt: new Date(),
      });
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
   * Add a user to a room
   */
  addUserToRoom(roomId: string, user: RoomUser): Room {
    const room = this.getOrCreateRoom(roomId);
    room.users.set(user.userId, user);
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
  getAllRooms(): { id: string; userCount: number; createdAt: Date }[] {
    const activeRooms: { id: string; userCount: number; createdAt: Date }[] = [];
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.size > 0) {
        activeRooms.push({
          id: roomId,
          userCount: room.users.size,
          createdAt: room.createdAt,
        });
      }
    }
    return activeRooms;
  }

  /**
   * Create a room (persist to DB and in-memory)
   */
  async createRoom(name: string, area: string, hostId: string) {
    const dbRoom = await this.prisma.room.create({
      data: {
        name,
        area: area as any,
        hostId,
        isActive: true,
      },
    });

    // Also create in-memory room
    this.getOrCreateRoom(dbRoom.id);

    return {
      id: dbRoom.id,
      name: dbRoom.name,
      area: dbRoom.area,
      hostId: dbRoom.hostId,
      isActive: dbRoom.isActive,
      createdAt: dbRoom.createdAt,
      userCount: 0,
    };
  }
}
