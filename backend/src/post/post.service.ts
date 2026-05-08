import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, UnescoArea, NotificationType, PostCategory } from '@prisma/client';

export interface PaginationParams {
  skip?: number;
  take?: number;
  category?: PostCategory;
}

export interface PaginatedPosts {
  data: Post[];
  total: number;
  skip: number;
  take: number;
  hasMore: boolean;
}

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Create a new post and notify users in the same UNESCO area
   */
  async create(authorId: string, dto: CreatePostDto): Promise<Post> {
    // Get author info including their area
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, name: true, email: true, area: true },
    });

    if (!author) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Create the post
    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        imageUrl: dto.imageUrl,
        category: dto.category,
        authorId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, area: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    // Emit real-time notification to users in the same UNESCO area
    const notificationData = {
      id: post.id,
      type: NotificationType.POST_CREATED,
      title: 'Nueva publicación',
      message: `${author.name} publicó: "${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}"`,
      senderId: author.id,
      senderName: author.name,
      createdAt: post.createdAt.toISOString(),
      read: false,
      area: author.area,
    };

    // Emit to the author's UNESCO area room (excluding the author)
    this.websocketGateway.emitToArea(author.area, 'post:new', notificationData);

    // Also emit to all connected users for global feed update
    this.websocketGateway.emitToAll('feed:update', {
      post: {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        category: post.category,
        createdAt: post.createdAt,
        author: {
          id: author.id,
          name: author.name,
          area: author.area,
        },
      },
    });

    console.log(`📝 Post creado por ${author.name} en área ${author.area}`);

    return post;
  }

  /**
   * Get all posts with pagination and optional category filter
   */
  async findAll(params: PaginationParams = {}): Promise<PaginatedPosts> {
    const { skip = 0, take = 20, category } = params;

    const where = category ? { category } : {};

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, area: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data,
      total,
      skip,
      take,
      hasMore: skip + take < total,
    };
  }

  /**
   * Get a specific post by ID
   */
  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, area: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return post;
  }

  /**
   * Update a post (only by author)
   */
  async update(id: string, userId: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);

    if (post.authorId !== userId) {
      throw new ForbiddenException('No puedes editar esta publicación');
    }

    return this.prisma.post.update({
      where: { id },
      data: dto,
      include: {
        author: {
          select: { id: true, name: true, email: true, area: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });
  }

  /**
   * Delete a post (only by author)
   */
  async remove(id: string, userId: string): Promise<Post> {
    const post = await this.findOne(id);

    if (post.authorId !== userId) {
      throw new ForbiddenException('No puedes eliminar esta publicación');
    }

    return this.prisma.post.delete({
      where: { id },
    });
  }

  /**
   * Get posts by user
   */
  async findByUser(userId: string): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: { authorId: userId },
      include: {
        author: {
          select: { id: true, name: true, email: true, area: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get posts by category
   */
  async findByCategory(category: PostCategory, skip = 0, take = 20): Promise<PaginatedPosts> {
    return this.findAll({ skip, take, category });
  }

  /**
   * Toggle like on a post
   */
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean }> {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } }
    });

    if (existing) {
      await this.prisma.like.delete({
        where: { userId_postId: { userId, postId } }
      });
      return { liked: false };
    }

    await this.prisma.like.create({
      data: { userId, postId }
    });

    // Notify post author about the like
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (post && post.authorId !== userId) {
      this.websocketGateway.emitToUser(post.authorId, 'post:liked', {
        postId,
        userId
      });
    }

    return { liked: true };
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, authorId: string, content: string) {
    const comment = await this.prisma.comment.create({
      data: { postId, authorId, content },
      include: {
        author: {
          select: { id: true, name: true, area: true }
        }
      }
    });

    // Notify post author about the comment
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (post && post.authorId !== authorId) {
      this.websocketGateway.emitToUser(post.authorId, 'post:commented', {
        postId,
        comment
      });
    }

    return comment;
  }

  /**
   * Get comments for a post (paginated)
   */
  async getComments(postId: string, skip = 0, take = 10) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: { id: true, name: true, area: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take
    });
  }
}
