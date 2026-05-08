import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async searchAll(q: string) {
    const query = { contains: q, mode: 'insensitive' as const };

    const [users, groups, rooms] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [{ name: query }, { email: query }],
        },
        select: {
          id: true,
          name: true,
          email: true,
          area: true,
          _count: { select: { followers: true, following: true } },
        },
        take: 10,
      }),
      this.prisma.group.findMany({
        where: { name: query },
        include: { _count: { select: { members: true } } },
        take: 10,
      }),
      this.prisma.room.findMany({
        where: { name: query, isActive: true },
        take: 10,
      }),
    ]);

    return { users, groups, rooms };
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        area: true,
        createdAt: true,
        _count: {
          select: { followers: true, following: true, posts: true },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async toggleFollow(followingId: string, followerId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('No puedes seguirte a ti mismo');
    }

    const existing = await this.prisma.userFollower.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      await this.prisma.userFollower.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
      return { following: false };
    }

    await this.prisma.userFollower.create({
      data: { followerId, followingId },
    });

    this.websocketGateway.emitToUser(followingId, 'user:followed', {
      followerId,
    });

    return { following: true };
  }

  async getFollowers(userId: string) {
    return this.prisma.userFollower.findMany({
      where: { followingId: userId },
      select: {
        follower: {
          select: { id: true, name: true, email: true, area: true },
        },
      },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.userFollower.findMany({
      where: { followerId: userId },
      select: {
        following: {
          select: { id: true, name: true, email: true, area: true },
        },
      },
    });
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.userFollower.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return !!follow;
  }
}
