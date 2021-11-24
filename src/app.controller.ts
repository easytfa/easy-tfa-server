import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { NotificationService } from "./notification.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly notificationService: NotificationService) {}

  @Post('public-key-by-hash')
  public getPublicKeyByHash(@Body() body: { hash: string }) {
    const publicKey = this.appService.getPublicKeyByHash(body.hash);
    if(publicKey == null) return { success: false };
    return {
      success: true,
      // TODO - App has to hash this again to make sure it matches
      publicKey: publicKey,
    };
  }

  @Post('link')
  public link(@Body() body: { hash: string; message: string; appPublicKey: string; }) {
    const client = this.appService.getClientByHash(body.hash);
    if(client == null) return { success: false };
    client.send(JSON.stringify({
      event: 'link',
      message: body.message,
      appPublicKey: body.appPublicKey,
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

  @Post('send-code')
  public async sendCode(@Body() body: { hash: string; message: string; }) {
    const client = this.appService.getClientByHash(body.hash);
    if(client == null) return { success: false };
    client.send(JSON.stringify({
      event: 'code',
      message: body.message,
    }));
    return { success: true };
  }

  @Post('register-notification-endpoint')
  public async registerNotificationEndpoint(@Body() body: { browserHashes: string[]; notificationEndpoint: string; }) {
    for(const browserHash of body.browserHashes) {
      console.log(`Registering notification endpoint for ${browserHash}`);
      await this.notificationService.registerNotificationEndpoint(browserHash, body.notificationEndpoint);
    }
    return { success: true };
  }
}
