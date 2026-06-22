import { PushNotifications, Token } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationManager {
  private static instance: NotificationManager;
  private token: string = '';

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async initialize() {
    if (Capacitor.getPlatform() === 'web') {
      console.log('Notifications not supported on web');
      return;
    }

    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Register for push
        await PushNotifications.register();
        
        // Setup listeners
        this.setupListeners();
        
        console.log('Push notifications initialized');
      } else {
        console.log('User denied notification permissions');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private setupListeners() {
    // On registration
    PushNotifications.addListener('registration', (token: Token) => {
      this.token = token.value;
      console.log('Push registration token:', this.token);
      this.sendTokenToServer(this.token);
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // On push received (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('Push received:', notification);
      
      // Show local notification
      LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: notification.title || 'MazadClick',
          body: notification.body || 'New notification',
          channelId: 'default',
          extra: notification.data || {},
          schedule: { at: new Date(Date.now() + 1000) }
        }]
      });
    });

    // On notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
      console.log('Notification tapped:', notification);
      this.handleNotificationTap(notification);
    });
  }

  private async sendTokenToServer(token: string) {
    try {
      // Send to your backend
      await fetch('https://mazadclick.com/api/register-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: Capacitor.getPlatform(),
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending token:', error);
    }
  }

  private handleNotificationTap(notification: any) {
    const data = notification.notification?.data;
    
    if (data?.url) {
      // Navigate to URL
      window.location.href = data.url;
    } else if (data?.type === 'auction') {
      window.location.href = `/auctions/${data.auctionId}`;
    }
    // Add more handlers
  }

  getToken(): string {
    return this.token;
  }

  async showLocalNotification(title: string, body: string, data?: any) {
    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title,
        body,
        channelId: 'default',
        extra: data || {},
        schedule: { at: new Date(Date.now() + 1000) }
      }]
    });
  }
}

export const notificationManager = NotificationManager.getInstance();