import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private clientsByHash = new Map<string, any>();
  private publicKeyByHash = new Map<string, string>();
  private codeQueryByHash = new Map<string, string>();

  public addClientByHash(client: any, hash: string) {
    this.clientsByHash.set(hash, client);
  }

  public getClientByHash(hash: string) {
    return this.clientsByHash.get(hash);
  }

  public addCodeQueryByHash(codeQuery: string, hash: string) {
    this.codeQueryByHash.set(hash, codeQuery);
  }

  public getCodeQueryByHash(hash: string) {
    const ret = this.codeQueryByHash.get(hash);
    if(ret != null) {
      this.codeQueryByHash.delete(hash);
    }
    return ret;
  }

  public setPublicKeyByHash(publicKey: string, hash: string) {
    this.publicKeyByHash.set(hash, publicKey);
  }

  public getPublicKeyByHash(hash: string) {
    return this.publicKeyByHash.get(hash);
  }

  // TODO - delete this at some time (e.g. when the WS connection is closed)
  public deletePublicKeyByHash(hash: string) {
    return this.publicKeyByHash.delete(hash);
  }
}
