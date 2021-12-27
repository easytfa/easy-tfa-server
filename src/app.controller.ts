import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { NotificationService } from './notification.service';
import * as config from 'config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly notificationService: NotificationService) {}

  @Get('healthcheck')
  public healthcheck() {
    return { success: true };
  }

  @Post('public-key-by-hash')
  public getPublicKeyByHash(@Body() body: { hash: string }) {
    const publicKey = this.appService.getPublicKeyByHash(body.hash);
    if(publicKey == null) return { success: false };
    return {
      success: true,
      publicKey: publicKey,
    };
  }

  @Post('message')
  public message(@Body() body: { hash: string; message: string; data: any }) {
    const client = this.appService.getClientByHash(body.hash);
    if(client == null) return { success: false };
    client.send(JSON.stringify({
      event: 'message',
      message: body.message,
      data: body.data,
    }));
    return { success: true };
  }

  @Post('code-queries-by-hashes')
  public async getCodeQueriesByHash(@Body() body: { hashes: string[]; }) {
    console.log('get code queries', body.hashes);
    let message = null;
    for(const hash of body.hashes) {
      const potentialMessage = await this.appService.getCodeQueryByHash(hash);
      if(potentialMessage != null) {
        message = potentialMessage;
        console.log('found req');
        break;
      }
    }
    return {
      success: true,
      message: message,
    };
  }

  @Post('register-notification-endpoint')
  public async registerNotificationEndpoint(@Body() body: { browserHashes: string[]; notificationEndpoint: string; }) {
    for(const browserHash of body.browserHashes) {
      console.log(`Registering notification endpoint for ${browserHash}`);
      await this.notificationService.registerNotificationEndpoint(browserHash, body.notificationEndpoint);
    }
    return { success: true };
  }

  @Get('config')
  @Header('Cache-Control', 'public, max-age=3600')
  public async getConfig() {
    return {
      success: true,
      version: process.env.npm_package_version,
      push: {
        supported: config.get<boolean>('PushNotifications.Enabled'),
        apiKey: config.get<string>('PushNotifications.ApiKey'),
        applicationId: config.get<string>('PushNotifications.ApplicationId'),
        projectId: config.get<string>('PushNotifications.ProjectId'),
      },
    };
  }
}
