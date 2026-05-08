import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { PostCategory } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'El contenido no puede estar vacío' })
  @MaxLength(500, { message: 'El contenido no puede exceder 500 caracteres' })
  content: string;

  @IsEnum(PostCategory, { message: 'Categoría inválida' })
  @IsNotEmpty({ message: 'La categoría es requerida' })
  category: PostCategory;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
