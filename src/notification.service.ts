import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as config from 'config';
import * as firebase from 'firebase-admin';
import { promises as fsPromise } from 'fs';
import * as fs from 'fs';

const NOTIFICATIONS_ENABLED = config.get<boolean>('PushNotifications.Enabled');
const NOTIFICATION_PROJECT_ID = config.get<string>('PushNotifications.ProjectId');

@Injectable()
export class NotificationService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private readonly firebaseApp: firebase.app.App;
  private readonly notificationEndpointByHash = new Map<string, { notificationEndpoint: string; createdAt: number }>();
  private readonly hashesByNotificationEndpoint = new Map<string, string[]>();
  private notificationEndpointListChanged = false;

  constructor() {
    if(!NOTIFICATIONS_ENABLED) {
      this.logger.log('Skipping notification initialization because they are disabled');
      return;
    }

    this.logger.log(`Initializing notifications for project '${NOTIFICATION_PROJECT_ID}', loading file ./easytfa-firebase-adminsdk.json...`);
    this.firebaseApp = firebase.initializeApp({
      credential: firebase.credential.cert('./easytfa-firebase-adminsdk.json'),
      projectId: NOTIFICATION_PROJECT_ID,
    });

    try {
      const data = fs.readFileSync('./data/notification-endpoints.json');
      this.notificationEndpointByHash = new Map(JSON.parse(data.toString()));
      this.createHashesByNotificationEndpointMap();
      this.logger.log(`Loaded ${this.notificationEndpointByHash.size} registered notification endpoints from ./data/notification-endpoints.json`);
    } catch(err) {
      this.logger.log('No existing notification endpoints found in ./data/notification-endpoints.json');
      // Create data directory if it doesn't exist yet
      try {
        fs.mkdirSync('./data', { recursive: true });
      } catch {
        // Best effort - if saving doesn't work, we'll print an error anyway
      }
    }

    // Save notification endpoints every minute
    setInterval(this.writeNotificationEndpointsToDisk.bind(this), 60000);
  }

  private createHashesByNotificationEndpointMap() {
    for(const entry of this.notificationEndpointByHash.entries()) {
      const notificationEndpoint = entry[1].notificationEndpoint;
      let hashes = this.hashesByNotificationEndpoint.get(notificationEndpoint);
      if(hashes == null) {
        hashes = [];
        this.hashesByNotificationEndpoint.set(notificationEndpoint, hashes);
      }
      hashes.push(entry[0]);
    }
  }

  public registerNotificationEndpoint(browserHashes: string[], notificationEndpoint: string): void {
    if(!NOTIFICATIONS_ENABLED) return;
    const createdAt = Math.floor(new Date().getTime() / 1000);

    // Delete outdated hashes
    const currentHashes = this.hashesByNotificationEndpoint.get(notificationEndpoint) ?? [];
    const hashesToDelete = currentHashes.filter(hash => !browserHashes.includes(hash));
    for(const hashToDelete of hashesToDelete) {
      this.notificationEndpointByHash.delete(hashToDelete);
    }

    // Register new hashes
    for(const hash of browserHashes) {
      this.notificationEndpointByHash.set(hash, { notificationEndpoint, createdAt });
    }
    this.hashesByNotificationEndpoint.set(notificationEndpoint, browserHashes);
    this.notificationEndpointListChanged = true;
  }

  private async writeNotificationEndpointsToDisk(): Promise<void> {
    if(!this.notificationEndpointListChanged) return;
    this.notificationEndpointListChanged = false;
    try {
      const data = JSON.stringify(Array.from(this.notificationEndpointByHash.entries()));
      await fsPromise.writeFile('./data/notification-endpoints.json', data);
      this.logger.log(`${this.notificationEndpointByHash.size} notification endpoints written to ./data/notification-endpoints.json`);
    } catch(err) {
      console.error('Saving notification endpoints failed', err);
    }
  }

  public async sendNotification(browserHash: string, title: string, body: string): Promise<void> {
    if(!NOTIFICATIONS_ENABLED) return;
    const recipient = this.notificationEndpointByHash.get(browserHash);
    if(recipient == null) {
      return;
    }

    try {
      await this.firebaseApp.messaging().send({
        token: recipient.notificationEndpoint,
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

  public async onModuleDestroy(): Promise<void> {
    if(!NOTIFICATIONS_ENABLED) return;
    await this.writeNotificationEndpointsToDisk();
  }
}
