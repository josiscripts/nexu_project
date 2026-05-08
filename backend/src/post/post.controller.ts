import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { PostCategory } from '@prisma/client';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Create a new post (with optional image upload to Cloudinary)
   * POST /posts (multipart/form-data or application/json)
   */
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Request() req: any,
    @Body() dto: CreatePostDto,
    @UploadedFile() file?: any,
  ) {
    const userId = req.user.userId;

    // If file is uploaded, upload to Cloudinary
    if (file) {
      const { secure_url } = await this.cloudinaryService.uploadImage(file);
      dto.imageUrl = secure_url;
    }

    return this.postService.create(userId, dto);
  }

  /**
   * Get all posts with pagination and optional category filter
   * GET /posts?category=INGENIERIA&skip=0&take=20
   */
  @Get()
  async findAll(
    @Query('category') category?: PostCategory,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip = 0,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take = 20,
  ) {
    return this.postService.findAll({ skip, take, category });
  }

  /**
   * Get current user's posts
   * GET /posts/mine
   */
  @Get('mine')
  async findMine(@Request() req: any) {
    const userId = req.user.userId;
    return this.postService.findByUser(userId);
  }

  /**
   * Get a specific post
   * GET /posts/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.postService.findOne(id);
  }

  /**
   * Update a post
   * PUT /posts/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: UpdatePostDto,
  ) {
    const userId = req.user.userId;
    return this.postService.update(id, userId, dto);
  }

  /**
   * Delete a post
   * DELETE /posts/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const userId = req.user.userId;
    return this.postService.remove(id, userId);
  }

  /**
   * Toggle like on a post
   * POST /posts/:id/likes
   */
  @Post(':id/likes')
  async toggleLike(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const userId = req.user.userId;
    return this.postService.toggleLike(id, userId);
  }

  /**
   * Get comments for a post
   * GET /posts/:id/comments?skip=0&take=10
   */
  @Get(':id/comments')
  async getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip = 0,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take = 10,
  ) {
    return this.postService.getComments(id, skip, take);
  }

  /**
   * Add a comment to a post
   * POST /posts/:id/comments
   */
  @Post(':id/comments')
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return this.postService.addComment(id, userId, dto.content);
  }
}
