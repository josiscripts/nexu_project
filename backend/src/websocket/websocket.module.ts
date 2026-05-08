import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './websocket.gateway';
import { WsGuard } from './websocket.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [WebsocketGateway, WsGuard],
  exports: [WebsocketGateway, WsGuard, JwtModule],
})
export class WebsocketModule {}