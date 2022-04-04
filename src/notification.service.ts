import { Injectable } from '@nestjs/common';
import * as config from 'config';
import * as firebase from 'firebase-admin';

@Injectable()
export class NotificationService {

  private firebaseApp: firebase.app.App;
  private notificationEndpointByHash = new Map<string, string>();

  constructor() {
    this.firebaseApp = firebase.initializeApp({
      credential: firebase.credential.cert('./easytfa-firebase-adminsdk.json'),
      projectId: config.get<string>('PushNotifications.ProjectId'),
    });
  }

  public registerNotificationEndpoint(browserHash: string, endpoint: string): void {
    this.notificationEndpointByHash.set(browserHash, endpoint);
  }

  public async sendNotification(browserHash: string, title: string, body: string): Promise<void> {
    const recipient = this.notificationEndpointByHash.get(browserHash);
    if(recipient == null) {
      return;
    }

    await this.firebaseApp.messaging().send({
      token: recipient,
      notification: {
        title,
        body,
      },
      android: {
        priority: 'high',
        notification: {
          priority: 'high',
          title,
          body,
          sound: 'default',
          channelId: 'easytfa_notification_channel',
          icon: 'ic_aegis_iconx',
          // TODO maybe add URL/website in the future
          tag: 'easytfa',
        },
      },
    });
  }
}
