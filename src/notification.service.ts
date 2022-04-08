import { Injectable, Logger } from '@nestjs/common';
import * as config from 'config';
import * as firebase from 'firebase-admin';

const NOTIFICATIONS_ENABLED = config.get<boolean>('PushNotifications.Enabled');
const NOTIFICATION_PROJECT_ID = config.get<string>('PushNotifications.ProjectId');

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly firebaseApp: firebase.app.App;
  private readonly notificationEndpointByHash = new Map<string, string>();

  constructor() {
    if(!NOTIFICATIONS_ENABLED) {
      this.logger.log('Skipping notification initialization because they are disabled');
      return;
    }
    this.logger.log(`Initializing notifications for project '${NOTIFICATION_PROJECT_ID}', loading file ./easytfa-firebase-adminsdk.json ...`);
    this.firebaseApp = firebase.initializeApp({
      credential: firebase.credential.cert('./easytfa-firebase-adminsdk.json'),
      projectId: NOTIFICATION_PROJECT_ID,
    });
  }

  public registerNotificationEndpoint(browserHash: string, endpoint: string): void {
    if(!NOTIFICATIONS_ENABLED) return;
    this.notificationEndpointByHash.set(browserHash, endpoint);
  }

  public async sendNotification(browserHash: string, title: string, body: string): Promise<void> {
    if(!NOTIFICATIONS_ENABLED) return;
    const recipient = this.notificationEndpointByHash.get(browserHash);
    if(recipient == null) {
      return;
    }

    try {
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
            tag: 'easytfa',
          },
        },
      });
    } catch(err) {
      console.error('Sending notification failed', err);
    }
  }
}
