import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsUUID,
  MinLength,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsEnum(NotificationType, { message: 'El tipo de notificación no es válido' })
  type: NotificationType;

  @IsString()
  @MinLength(1, { message: 'El mensaje no puede estar vacío' })
  message: string;

  @IsUUID('4', { message: 'El ID del destinatario debe ser un UUID válido' })
  recipientId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del post debe ser un UUID válido' })
  postId?: string;
}