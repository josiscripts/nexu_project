import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();

    console.log(`\n📍 [WsGuard] Intentando autenticar socket: ${client.id}`);

    const token = this.extractToken(client);

    if (!token) {
      console.error('❌ [WsGuard] Token no proporcionado');
      console.log('[WsGuard] Auth object:', client.handshake.auth);
      console.log('[WsGuard] Headers:', {
        authorization: client.handshake.headers.authorization,
        cookie: client.handshake.headers.cookie ? 'presente' : 'ausente',
      });
      console.error('[WsGuard] Socket será desconectado sin autenticación');
      throw new WsException('Token de autenticación no proporcionado');
    }

    console.log('[WsGuard] Token encontrado, longitud:', token.length);

    try {
      const secretKey = process.env.JWT_SECRET;
      if (!secretKey) {
        console.error('❌ [WsGuard] JWT_SECRET no está configurado en .env');
        throw new WsException('Error de configuración del servidor');
      }

      console.log('[WsGuard] Verificando JWT con secretKey presente...');
      const payload = this.jwtService.verify(token, { secret: secretKey });

      console.log('[WsGuard] JWT verificado exitosamente');
      console.log('[WsGuard] Payload:', {
        sub: payload.sub,
        email: payload.email,
        iat: payload.iat,
        exp: payload.exp,
      });

      // Attach user info to socket for later use
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name || 'Usuario',
      };

      console.log(`✅ [WsGuard] Socket autenticado exitosamente: ${client.data.user.email} (${client.data.user.userId})`);
      return true;
    } catch (error: any) {
      console.error('❌ [WsGuard] Error verificando JWT:', {
        message: error.message,
        name: error.name,
        tokenLength: token ? token.length : 'sin token',
      });
      throw new WsException(`Token inválido o expirado: ${error.message}`);
    }
  }

  private extractToken(client: Socket): string | null {
    // Intenta 1: auth.token
    const auth = client.handshake.auth;
    if (auth?.token) {
      let token = auth.token;
      console.log('[WsGuard] Token encontrado en auth.token');
      // Remove Bearer prefix if present
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
      return token;
    }

    // Intenta 2: header authorization
    const headers = client.handshake.headers;
    const authorization = headers.authorization as string;
    if (authorization?.startsWith('Bearer ')) {
      console.log('[WsGuard] Token encontrado en header authorization');
      return authorization.substring(7);
    }

    // Intenta 3: cookie (próximamente si es necesario)
    console.log('[WsGuard] Métodos de autenticación disponibles:', {
      authToken: !!auth?.token,
      authorizationHeader: !!authorization,
      allHeaders: Object.keys(headers),
    });

    return null;
  }
}