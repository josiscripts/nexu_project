import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Token de autenticación no proporcionado');
    }

    try {
      const secretKey = process.env.JWT_SECRET;
      if (!secretKey) {
        throw new WsException('Error de configuración del servidor');
      }

      const payload = this.jwtService.verify(token, { secret: secretKey });
      // Attach user info to socket for later use
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
      };
      return true;
    } catch (error) {
      throw new WsException('Token inválido o expirado');
    }
  }

  private extractToken(client: Socket): string | null {
    // Extract token from handshake auth or headers
    const auth = client.handshake.auth;
    if (auth?.token) {
      return auth.token;
    }

    // Also check authorization header
    const headers = client.handshake.headers;
    const authorization = headers.authorization as string;
    if (authorization?.startsWith('Bearer ')) {
      return authorization.substring(7);
    }

    return null;
  }
}