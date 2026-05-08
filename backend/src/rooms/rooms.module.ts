import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway, PrismaService],
  exports: [RoomsService],
})
export class RoomsModule {}
