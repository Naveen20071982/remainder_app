import { LocalNotifications, Channel } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
  private static isNative = Capacitor.isNativePlatform();

  static async init() {
    if (this.isNative) {
      // Create notification channel for Android
      await this.createNotificationChannel();
      // Request permissions
      await this.requestPermission();
    }
  }

  static isSupported() {
    if (this.isNative) {
      return true;
    }
    return 'Notification' in window;
  }

  static getPermission() {
    if (this.isNative) {
      return 'granted'; // Will be handled by native layer
    }
    return this.isSupported() ? Notification.permission : 'denied';
  }

  static async requestPermission() {
    if (this.isNative) {
      try {
        const result = await LocalNotifications.requestPermissions();
        console.log('Native notification permission:', result);
        return result.display === 'granted';
      } catch (error) {
        console.error('Error requesting native notification permission:', error);
        return false;
      }
    } else {
      // Web fallback
      if (!this.isSupported()) {
        console.log('This browser does not support desktop notification');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      try {
        const permission = await Notification.requestPermission();
        console.log('Web notification permission:', permission);
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
  }

  static async showNotification(title: string, options?: NotificationOptions) {
    if (this.isNative) {
      try {
        const notificationId = Math.floor(Math.random() * 10000);
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body: (options?.body as string) || 'Notification',
              id: notificationId,
              smallIcon: 'ic_stat_icon_config_example',
              iconColor: '#488AFF',
              sound: 'default',
            } as any,
          ],
        });
        console.log('Native notification sent:', title);
      } catch (error) {
        console.error('Error showing native notification:', error);
      }
    } else {
      // Web fallback
      if (this.isSupported() && Notification.permission === 'granted') {
        try {
          return new Notification(title, {
            icon: 'https://www.gstatic.com/images/branding/product/1x/keep_48dp.png',
            badge: 'https://www.gstatic.com/images/branding/product/1x/keep_48dp.png',
            ...options
          });
        } catch (error) {
          console.error('Error showing notification:', error);
        }
      }
    }
  }

  private static async createNotificationChannel() {
    if (this.isNative && Capacitor.getPlatform() === 'android') {
      try {
        await LocalNotifications.createChannel({
          id: 'default',
          name: 'Default',
          importance: 5,
          visibility: 1,
          sound: 'default',
          vibrate: true,
        } as Channel);
        console.log('Notification channel created');
      } catch (error) {
        console.error('Error creating notification channel:', error);
      }
    }
  }
}
