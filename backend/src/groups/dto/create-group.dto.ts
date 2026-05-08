import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { UnescoArea } from '@prisma/client';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  description?: string;

  @IsEnum(UnescoArea)
  @IsNotEmpty()
  area: UnescoArea;
}
