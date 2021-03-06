import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { NotificationService } from './notification.service';
import * as config from 'config';

@Controller()
export class AppController {
  private readonly version: string;

  constructor(private readonly appService: AppService, private readonly notificationService: NotificationService) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.version = require('./package.json').version;
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.version = require('../package.json').version;
    }
  }

  @Get('healthcheck')
  @Header('Cache-Control', 'public, max-age=15')
  public healthcheck() {
    return { success: true };
  }

  @Post('public-key-by-hash')
  public getPublicKeyByHash(@Body() body: { hash: string }) {
    const publicKey = this.appService.getPublicKeyByHash(body.hash);
    if(publicKey == null) return { success: false };
    return {
      success: true,
      publicKey: publicKey.publicKey,
      connectionId: publicKey.connectionId,
    };
  }

  @Post('code-queries-by-hashes')
  public getCodeQueriesByHash(@Body() body: { hashes: string[]; }) {
    let message = null;
    for(const hash of body.hashes) {
      const potentialMessage = this.appService.getMessageByHash(hash);
      if(potentialMessage != null) {
        message = potentialMessage;
        break;
      }
    }
    return {
      success: true,
      message: message?.message ?? null,
      connectionId: message?.connectionId ?? null,
    };
  }

  @Post('message')
  public message(@Body() body: { connectionId: string; message: string; data: any }) {
    const client = this.appService.getClientByUuid(body.connectionId);
    if(client == null) return { success: false };
    client.send(JSON.stringify({
      event: 'message',
      message: body.message,
      data: body.data,
    }));
    return { success: true };
  }

  @Post('register-notification-endpoint')
  public registerNotificationEndpoint(@Body() body: { browserHashes: string[]; notificationEndpoint: string; }) {
    this.notificationService.registerNotificationEndpoint(body.browserHashes, body.notificationEndpoint);
    return { success: true };
  }

  @Get('config')
  @Header('Cache-Control', 'public, max-age=86400')
  public getConfig() {
    return {
      success: true,
      version: this.version,
      push: {
        supported: config.get<boolean>('PushNotifications.Enabled'),
        apiKey: config.get<string>('PushNotifications.ApiKey'),
        applicationId: config.get<string>('PushNotifications.ApplicationId'),
        projectId: config.get<string>('PushNotifications.ProjectId'),
      },
    };
  }
}
