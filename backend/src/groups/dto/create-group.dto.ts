import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum, IsUrl } from 'class-validator';
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

  @IsUrl()
  @IsOptional()
  bannerUrl?: string;

  @IsEnum(UnescoArea)
  @IsNotEmpty()
  area: UnescoArea;
}
