import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { AppService } from 'src/app.service';
import { ab2str, str2ab } from 'src/util';
import { webcrypto } from 'crypto';
import { NotificationService } from "./notification.service";
// Typing seems to be missing?
const { subtle } = webcrypto as any;

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly appService: AppService, private readonly notificationService: NotificationService) {}

  // TODO - include timestamp to stop replay
  @SubscribeMessage('start-linking')
  public async startLinking(@MessageBody() publicKey: string, @ConnectedSocket() client: any): Promise<any> {
    const hashBuffer = await subtle.digest('SHA-256', new TextEncoder().encode(publicKey));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16)
      .padStart(2, '0'))
      .join('');
    await this.appService.setPublicKeyByHash(publicKey, hashHex);
    await this.appService.addClientByHash(client, hashHex);
    return { event: 'linking-started' };
  }

  @SubscribeMessage('query-code')
  public async handleQueryCode(@MessageBody() body: { hash: string; message: string }, @ConnectedSocket() client: any): Promise<any> {
    this.appService.addClientByHash(client, body.hash);
    console.log(`query code for ${body.hash}...`);
    this.appService.addCodeQueryByHash(body.message, body.hash);
    await this.notificationService.sendNotification(body.hash, 'TFA request', 'Please check this request');
    return { event: 'query-code-started' };
  }

  public handleConnection(client: any, ...args: any[]): any {
    console.log('new connection');
  }

  public handleDisconnect(client: any): any {
    console.log('client disconnected');
  }

}
