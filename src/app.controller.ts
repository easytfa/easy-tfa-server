import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
  public link(@Body() body: { hash: string; message: string; }) {
    const client = this.appService.getClientByHash(body.hash);
    if(client == null) return { success: false };
    client.send(JSON.stringify({
      event: 'link',
      message: body.message,
    }));
    return { success: true };
  }

  @Post('code-queries-by-hashes')
  public async getCodeQueriesByHash(@Body() body: { hashes: string[]; }) {
    let message = null;
    for(const hash of body.hashes) {
      const potentialMessage = await this.appService.getCodeQueryByHash(hash);
      if(potentialMessage != null) {
        message = potentialMessage;
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
}
