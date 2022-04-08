import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import * as crypto from 'crypto';
import { AppService } from 'src/app.service';
import { NotificationService } from "./notification.service";
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway()
export class AppGateway {
  constructor(private readonly appService: AppService, private readonly notificationService: NotificationService) {}

  // TODO - include timestamp to stop replay (is this really a problem?)
  @SubscribeMessage('start-linking')
  public startLinking(@MessageBody() publicKey: string, @ConnectedSocket() client: any) {
    const hashHex = crypto.createHash('sha256').update(publicKey).digest('hex');
    const connectionId = uuidv4();
    this.appService.setPublicKeyByHash(publicKey, hashHex, connectionId);
    this.appService.addClientByUuid(client, connectionId);
    return { event: 'linking-started' };
  }

  @SubscribeMessage('query-code')
  public async handleQueryCode(@MessageBody() body: { hash: string; message: string }, @ConnectedSocket() client: any): Promise<any> {
    const connectionId = uuidv4();
    this.appService.addClientByUuid(client, connectionId);
    this.appService.addMessageByHash(body.message, body.hash, connectionId);
    await this.notificationService.sendNotification(body.hash, 'TFA request', 'Please check this request');
    return { event: 'query-code-started' };
  }
}
