import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import * as crypto from 'crypto';
import { AppService } from 'src/app.service';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer as TWebSocketServer } from 'ws';
import { NotificationService } from './notification.service';

@WebSocketGateway()
export class AppGateway {
  @WebSocketServer()
  private server: TWebSocketServer;

  constructor(private readonly appService: AppService, private readonly notificationService: NotificationService) {
    // Keep alive for ws connections (the client will close the connection after they received a message)
    setInterval(() => {
      for(const client of this.server.clients) {
        client.ping();
      }
    }, 15000);
  }

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
