import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UnescoArea } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @MinLength(3, { message: 'El nombre es demasiado corto' })
  name: string;

  @IsEnum(UnescoArea, { message: 'El área académica no es válida' })
  area: UnescoArea;
}
