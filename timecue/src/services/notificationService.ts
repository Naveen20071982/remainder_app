export class NotificationService {
  static isSupported() {
    return 'Notification' in window;
  }

  static getPermission() {
    return this.isSupported() ? Notification.permission : 'denied';
  }

  static async requestPermission() {
    if (!this.isSupported()) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Permission:::',permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  static async showNotification(title: string, options?: NotificationOptions) {
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
