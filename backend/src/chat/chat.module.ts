import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebsocketModule],
  providers: [ChatService, ChatGateway, PrismaService],
  exports: [ChatService],
})
export class ChatModule {}
