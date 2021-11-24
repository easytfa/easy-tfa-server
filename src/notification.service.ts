import { Injectable } from "@nestjs/common";
import * as firebase from 'firebase-admin';

@Injectable()
export class NotificationService {

  private firebaseApp: firebase.app.App;
  private notificationEndpointByHash = new Map<string, string>();

  constructor() {
    this.firebaseApp = firebase.initializeApp({
      credential: firebase.credential.cert('./easytfa-firebase-adminsdk.json'),
      projectId: 'easytfa'
    });
  }

  public async registerNotificationEndpoint(browserHash: string, endpoint: string): Promise<void> {
    this.notificationEndpointByHash.set(browserHash, endpoint);
  }

  public async sendNotification(browserHash: string, title: string, body: string): Promise<void> {
    console.log(`Trying to send notification for ${browserHash}`);
    const recipient = this.notificationEndpointByHash.get(browserHash);
    if(recipient == null)
      return;

    console.log(`Sending notification to: ${recipient}`);

    await this.firebaseApp.messaging().send({
      token: recipient,
      notification: {
        title,
        body
      },
      android: {
        priority: 'high'
      }
    })
  }
}
