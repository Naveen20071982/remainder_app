import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export class BackgroundScheduler {
  private static scheduledReminders = new Map<string, number | NodeJS.Timeout>();
  private static isNative = Capacitor.isNativePlatform();

  /**
   * Initialize background scheduler
   * This should be called when the app starts
   */
  static async init() {
    console.log('BackgroundScheduler: Initializing...');

    await this.requestNotificationPermission();
    this.setupPeriodicCheck();
  }

  /**
   * Request notification permission from the user
   */
  static async requestNotificationPermission() {
    try {
      const result = await LocalNotifications.requestPermissions();
      console.log('Notification permission result:', result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  /**
   * Load all pending reminders from Firebase and schedule them
   */
  static async schedulePendingReminders(userId?: string) {
    try {
      if (!userId) return;

      const remindersRef = collection(db, 'reminders');
      const q = query(
        remindersRef,
        where('userId', '==', userId),
        where('isCompleted', '==', false),
        where('notificationsEnabled', '==', true)
      );

      const snapshot = await getDocs(q);
      this.clearAllScheduledReminders();

      snapshot.docs.forEach(doc => {
        const reminder = { id: doc.id, ...doc.data() } as {
          id: string;
          title: string;
          description?: string;
          scheduledAt: string;
          userId: string;
        };
        this.scheduleReminder(doc.id, reminder);
      });

      console.log(`BackgroundScheduler: Scheduled ${snapshot.docs.length} reminders`);
    } catch (error) {
      console.error('Error scheduling pending reminders:', error);
    }
  }

  /**
   * Schedule a single reminder
   */
  static async scheduleReminder(
    reminderId: string,
    reminder: {
      title: string;
      description?: string;
      scheduledAt: string;
      userId: string;
    }
  ) {
    try {
      const scheduledTime = new Date(reminder.scheduledAt);
      const now = new Date();

      if (scheduledTime <= now) {
        console.log(`BackgroundScheduler: Reminder ${reminderId} already past, skipping`);
        return;
      }

      if (this.scheduledReminders.has(reminderId)) {
        const existing = this.scheduledReminders.get(reminderId);
        if (typeof existing === 'number') {
          await LocalNotifications.cancel({ notifications: [{ id: existing }] });
        } else {
          clearTimeout(existing);
        }
      }

      if (this.isNative) {
        const notificationId = this.getNotificationId(reminderId);
        await LocalNotifications.schedule({
          notifications: [
            {
              title: reminder.title,
              body: reminder.description || 'Time for your reminder!',
              id: notificationId,
              smallIcon: 'ic_stat_icon_config_example',
              iconColor: '#488AFF',
              sound: 'default',
              schedule: {
                at: scheduledTime,
                allowWhileIdle: true,
              },
            } as any,
          ],
        });
        this.scheduledReminders.set(reminderId, notificationId);
        console.log(`BackgroundScheduler: Native reminder scheduled for ${scheduledTime.toLocaleString()}`);
      } else {
        const delayMs = scheduledTime.getTime() - now.getTime();
        const timeout = setTimeout(() => {
          this.triggerNotification(reminderId, reminder);
        }, delayMs);
        this.scheduledReminders.set(reminderId, timeout);
        console.log(
          `BackgroundScheduler: Web reminder scheduled for ${scheduledTime.toLocaleString()} (in ${Math.round(delayMs / 1000)} seconds)`
        );
      }
    } catch (error) {
      console.error('Error scheduling reminder:', error);
    }
  }

  /**
   * Trigger a notification for a reminder
   */
  static async triggerNotification(
    reminderId: string,
    reminder: {
      title: string;
      description?: string;
    }
  ) {
    try {
      const notificationId = Math.floor(Math.random() * 10000);
      await LocalNotifications.schedule({
        notifications: [
          {
            title: reminder.title,
            body: reminder.description || 'Time for your reminder!',
            id: notificationId,
            smallIcon: 'ic_stat_icon_config_example',
            iconColor: '#488AFF',
            sound: 'default',
          } as any,
        ],
      });
      this.scheduledReminders.delete(reminderId);
      console.log(`BackgroundScheduler: Notification sent for reminder "${reminder.title}"`);
    } catch (error) {
      console.error('Error triggering notification:', error);
    }
  }

  /**
   * Set up periodic check to reload reminders (every minute)
   */
  static setupPeriodicCheck() {
    const interval = setInterval(() => {
      console.log('BackgroundScheduler: Running periodic check');
    }, 60000);
    return interval;
  }

  /**
   * Clear all scheduled reminders
   */
  static clearAllScheduledReminders() {
    this.scheduledReminders.forEach((scheduled) => {
      if (typeof scheduled === 'number') {
        LocalNotifications.cancel({ notifications: [{ id: scheduled }] }).catch(() => {
          /* ignore */
        });
      } else {
        clearTimeout(scheduled);
      }
    });
    this.scheduledReminders.clear();
  }

  /**
   * Convert reminder ID to a stable numeric notification ID
   */
  private static getNotificationId(reminderId: string) {
    let hash = 0;
    for (let i = 0; i < reminderId.length; i += 1) {
      hash = (hash << 5) - hash + reminderId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash || 0) || 1;
  }

  /**
   * Reschedule reminders (useful when reminders change)
   */
  static async rescheduleReminders(userId: string) {
    await this.schedulePendingReminders(userId);
  }
}
