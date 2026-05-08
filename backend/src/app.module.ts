import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { cloudinaryConfig } from './common/config/cloudinary.config';
import { CommonModule } from './common/common.module';
import { WebsocketModule } from './websocket/websocket.module';
import { NotificationModule } from './notification/notification.module';
import { PostModule } from './post/post.module';
import { ChatModule } from './chat/chat.module';
import { RoomsModule } from './rooms/rooms.module';
import { GroupsModule } from './groups/groups.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [cloudinaryConfig],
    }),
    CommonModule,
    AuthModule,
    WebsocketModule,
    NotificationModule,
    PostModule,
    ChatModule,
    RoomsModule,
    GroupsModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}