# Background Notifications Setup Guide

This document explains how the background notification system works and how to maintain it.

## Overview

The TimeCue app now supports background notifications for reminders. When you set a reminder for a specific date and time, the app will trigger a notification at that exact time - even if the app is closed or in the background.

## Architecture

### Key Components

1. **NotificationService** (`src/services/notificationService.ts`)
   - Handles both web and native (mobile) notifications
   - Automatically detects if running on native platform or web
   - Manages notification permissions
   - Uses Capacitor's LocalNotifications for native apps
   - Falls back to Web Notifications API for browsers

2. **BackgroundScheduler** (`src/services/backgroundScheduler.ts`)
   - Manages scheduled reminders
   - Loads pending reminders from Firebase
   - Schedules notifications to trigger at the set time
   - Runs continuously in the background

3. **App.tsx** (Main app component)
   - Initializes notification services on app startup
   - Sets up background scheduler when user logs in
   - Automatically reschedules reminders when they change

## How It Works

### Web Platform

1. When the app loads, `NotificationService.init()` is called
2. User is prompted to allow notifications
3. When reminders are loaded, `BackgroundScheduler` calculates the delay until each reminder
4. JavaScript `setTimeout()` schedules the notification at the correct time
5. Notification is shown using the Web Notifications API
6. **Note:** This only works while the tab is open or if Service Worker is active

### Mobile Platform (Android/iOS with Capacitor)

1. When the app loads, `NotificationService.init()` creates a notification channel
2. `LocalNotifications` plugin is initialized
3. When reminders are loaded, `BackgroundScheduler` calculates delays
4. Notifications are scheduled through the native layer
5. The native OS handles showing notifications at the scheduled time
6. **Works even when app is closed or in background**

## Setup Instructions

### 1. Installation (Already Done)

The following packages are already installed:
```bash
npm install @capacitor/local-notifications @capacitor/background-runner
```

### 2. Android Configuration

Required permissions are already added to `android/app/src/main/AndroidManifest.xml`:
- `POST_NOTIFICATIONS` - Required for showing notifications
- `WAKE_LOCK` - Allows app to keep working in background
- `SCHEDULE_EXACT_ALARM` - For precise notification timing
- `VIBRATE` - For notification vibration

### 3. Building for Android

To build and run on Android:

```bash
# Build the web app
npm run build

# Sync with Capacitor
npx cap sync android

# Open Android Studio
npx cap open android
```

Then in Android Studio:
1. Select your device/emulator
2. Click "Run" or press Shift+F10
3. Grant notification permission when prompted

### 4. Testing Notifications

To test the background notification functionality:

1. **Open the app** and log in
2. **Create a reminder** with a time 1-2 minutes in the future
3. **Close the app** or minimize it
4. **Wait** until the scheduled time
5. **You should receive a notification** even though the app is closed

### 5. iOS Considerations

For iOS, the same code works but with native iOS implementations:
- Requires iOS 10.0+ for local notifications
- Permissions are requested via native prompts
- Very similar behavior to Android

## Configuration

### Notification Channel (Android Only)

The notification channel is created in `NotificationService.init()`:

```typescript
await LocalNotifications.createChannel({
  id: 'default',
  name: 'Default',
  importance: 5,        // High importance
  visibility: 1,        // Public visibility
  sound: 'default',     // Use default sound
  vibrate: true,        // Enable vibration
});
```

To customize:
- Change `importance` (0-5) to adjust priority
- Modify `sound` to use different notification sounds
- Set `vibrate: false` to disable vibration

### Notification Appearance

Customize notification appearance in `BackgroundScheduler.triggerNotification()`:

```typescript
{
  title: reminder.title,
  body: reminder.description || 'Time for your reminder!',
  id: notificationId,
  smallIcon: 'ic_stat_icon_config_example',  // Change icon
  iconColor: '#488AFF',                        // Change color
  sound: 'default',
  vibrate: [200, 100, 200],                   // Vibration pattern
}
```

## Troubleshooting

### Notifications Not Showing

1. **Check permissions:**
   - Android: Settings > Apps > TimeCue > Permissions > Notifications
   - iOS: Settings > TimeCue > Notifications

2. **Check reminder times:**
   - Make sure reminder time is in the future when created
   - Check that your device time is correct

3. **Check logs:**
   - Open browser DevTools (F12) or Xcode console for logs
   - Look for "BackgroundScheduler:" messages

### Reminders Not Triggering

1. **App closed completely:**
   - On Android, reminders should still trigger (native behavior)
   - On web, app tab must be open

2. **Device in low-power mode:**
   - Some devices disable background features in low-power mode
   - Disable or add app to whitelist

3. **Battery optimization:**
   - Some devices have aggressive battery optimization
   - Add TimeCue to battery optimization whitelist

## Firebase Integration

Reminders are stored in Firestore with this structure:

```typescript
{
  userId: string,           // User's UID
  title: string,           // Reminder title
  description: string,     // Optional description
  scheduledAt: string,     // ISO timestamp (when to trigger)
  createdAt: string,       // When reminder was created
  isCompleted: boolean,    // Whether reminder is done
  notificationsEnabled: boolean  // Whether notifications are on
}
```

When a reminder is created or modified, the app automatically reschedules notifications.

## Performance Considerations

- **Memory:** Each scheduled reminder uses one JavaScript timeout on web
- **Battery:** Native implementation is optimized for battery life
- **Network:** No network required once reminders are loaded
- **Firebase:** Reminders are checked when app loads; periodic checks every minute

## Future Improvements

Possible enhancements:

1. **Recurring reminders:** Add support for daily/weekly/monthly reminders
2. **Custom sounds:** Allow users to choose notification sounds
3. **Snooze functionality:** Implement snooze with automatic rescheduling
4. **Notification history:** Keep track of shown notifications
5. **Do not disturb:** Respect system DND settings
6. **Multiple reminders:** Show multiple notifications before the actual time

## Support

If you encounter issues:

1. Check the browser/native console for errors
2. Verify Firebase connection
3. Ensure all permissions are granted
4. Check device date/time settings
5. Rebuild and reinstall the app
