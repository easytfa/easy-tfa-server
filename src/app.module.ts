import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationService } from "./notification.service";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AppGateway, NotificationService],
})
export class AppModule {}
