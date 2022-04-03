import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private websocketClientsByUuid = new Map<string, any>();
  private publicKeyByHash = new Map<string, { publicKey: string; connectionId: string }>();
  private messageByHash = new Map<string, { message: string; connectionId: string }>();

  public addClientByUuid(client: any, uuid: string) {
    this.websocketClientsByUuid.set(uuid, client);
  }

  public getClientByUuid(uuid: string) {
    return this.websocketClientsByUuid.get(uuid);
  }

  public addMessageByHash(message: string, hash: string, connectionId: string) {
    this.messageByHash.set(hash, { message: message, connectionId });
  }

  public getMessageByHash(hash: string) {
    const ret = this.messageByHash.get(hash);
    if(ret != null) {
      this.messageByHash.delete(hash);
    }
    return ret;
  }

  public setPublicKeyByHash(publicKey: string, hash: string, connectionId: string) {
    this.publicKeyByHash.set(hash, { publicKey, connectionId });
  }

  public getPublicKeyByHash(hash: string) {
    return this.publicKeyByHash.get(hash);
  }

  // TODO - delete this at some time (e.g. when the WS connection is closed)
  public deletePublicKeyByHash(hash: string) {
    return this.publicKeyByHash.delete(hash);
  }
}
