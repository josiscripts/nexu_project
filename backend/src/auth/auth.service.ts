import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt'; // <--- Importamos el servicio de JWT
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Sub-tarea 2: Lógica de Hash con Salting
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async register(dto: RegisterDto) {
    const { email, name, password, area } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) throw new ConflictException('El correo ya está registrado');

    const hashedPassword = await this.hashPassword(password);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        area,
      },
      select: { id: true, email: true, name: true, area: true }
    });

    const payload = { email: newUser.email, sub: newUser.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: newUser
    };
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Si no hay usuario o la contraseña no coincide, lanzamos el error que ahora SÍ está importado
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        area: user.area
      }
    };
  }

// Limpiamos el código que no usamos para evitar ruido en el TFG
  async remove(id: string) {
    return await this.prisma.user.delete({ where: { id } });
  }
}
