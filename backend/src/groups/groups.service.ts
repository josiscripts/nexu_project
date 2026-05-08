import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async create(dto: CreateGroupDto, hostId: string) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        area: dto.area,
        hostId,
      },
      include: {
        _count: { select: { members: true } },
        host: { select: { id: true, name: true } },
      },
    });

    this.websocketGateway.emitToArea(group.area, 'group:created', {
      group,
    });

    return group;
  }

  async findAll(userId?: string) {
    const groups = await this.prisma.group.findMany({
      include: {
        _count: { select: { members: true } },
        host: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!userId) return groups;

    // Add isMember flag for each group
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    const memberGroupIds = new Set(memberships.map(m => m.groupId));

    return groups.map(group => ({
      ...group,
      isMember: memberGroupIds.has(group.id),
    }));
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        members: {
          select: { user: { select: { id: true, name: true, email: true, area: true } } },
        },
        host: { select: { id: true, name: true } },
      },
    });

    if (!group) throw new NotFoundException('Grupo no encontrado');
    return group;
  }

  async join(groupId: string, userId: string) {
    const group = await this.findOne(groupId);

    const existing = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (existing) return group;

    await this.prisma.groupMember.create({
      data: { userId, groupId },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    this.websocketGateway.emitToArea(group.area, 'group:user-joined', {
      groupId,
      userId,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    });

    return this.findOne(groupId);
  }

  async leave(groupId: string, userId: string) {
    const group = await this.findOne(groupId);

    await this.prisma.groupMember.delete({
      where: { userId_groupId: { userId, groupId } },
    });

    this.websocketGateway.emitToArea(group.area, 'group:user-left', {
      groupId,
      userId,
    });

    return this.findOne(groupId);
  }
}
