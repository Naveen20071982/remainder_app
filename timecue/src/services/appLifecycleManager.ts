import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { BackgroundScheduler } from './backgroundScheduler';
import { auth } from '../firebase';

/**
 * AppLifecycleManager
 * Handles app lifecycle events to manage background scheduler
 */
export class AppLifecycleManager {
  private static isInitialized = false;

  /**
   * Initialize app lifecycle listeners
   * This ensures background scheduler continues working when app goes to background
   */
  static initialize() {
    if (this.isInitialized) return;

    if (!Capacitor.isNativePlatform()) {
      console.log('AppLifecycleManager: Running on web, lifecycle management not needed');
      return;
    }

    try {
      // Listen to app pause events
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('AppLifecycleManager: App resumed');
          this.handleAppResume();
        } else {
          console.log('AppLifecycleManager: App paused');
          this.handleAppPause();
        }
      });

      // Listen to app resume events
      App.addListener('resume', () => {
        console.log('AppLifecycleManager: App resumed (resume event)');
        this.handleAppResume();
      });

      // Listen to app pause events
      App.addListener('pause', () => {
        console.log('AppLifecycleManager: App paused (pause event)');
        this.handleAppPause();
      });

      this.isInitialized = true;
      console.log('AppLifecycleManager: Initialized');
    } catch (error) {
      console.error('Error initializing AppLifecycleManager:', error);
    }
  }

  /**
   * Handle app resume - reschedule reminders
   */
  private static handleAppResume() {
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('AppLifecycleManager: Rescheduling reminders for resumed app');
      BackgroundScheduler.rescheduleReminders(currentUser.uid).catch(error => {
        console.error('Error rescheduling reminders on app resume:', error);
      });
    }
  }

  /**
   * Handle app pause - background scheduler continues working natively
   */
  private static handleAppPause() {
    // Background scheduler continues working in native layer
    console.log('AppLifecycleManager: App paused, native notifications continue');
  }
}
