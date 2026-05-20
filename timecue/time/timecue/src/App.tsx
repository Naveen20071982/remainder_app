import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/auth/AuthForm';
import { ReminderList } from './components/reminders/ReminderList';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { LogOut, Loader2 } from 'lucide-react';
import { NotificationService } from './services/notificationService';
import { BackgroundScheduler } from './services/backgroundScheduler';
import { AppLifecycleManager } from './services/appLifecycleManager';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Reminder } from './types';
import { motion } from 'motion/react';

export default function App() {
  const { user, loading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(NotificationService.getPermission() === 'granted');

  // Initialize notification service and background scheduler on app load
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize app lifecycle management
        AppLifecycleManager.initialize();
        
        // Initialize notification service
        await NotificationService.init();
        await NotificationService.requestPermission();
        setNotificationsEnabled(true);
        console.log('NotificationService initialized');
      } catch (error) {
        console.error('Error initializing notification service:', error);
      }
    };

    initializeServices();
  }, []);

  // Set up background scheduler when user logs in
  useEffect(() => {
    if (user) {
      const setupBackgroundScheduling = async () => {
        try {
          // Initialize background scheduler
          await BackgroundScheduler.init();
          
          // Schedule all pending reminders for this user
          await BackgroundScheduler.schedulePendingReminders(user.uid);
          
          console.log('Background scheduler initialized for user:', user.uid);
        } catch (error) {
          console.error('Error setting up background scheduler:', error);
        }
      };

      setupBackgroundScheduling();
    }
  }, [user]);

  // Listen to reminder changes and reschedule
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'reminders'),
        where('userId', '==', user.uid),
        where('isCompleted', '==', false)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        // Reschedule reminders when they change
        try {
          await BackgroundScheduler.schedulePendingReminders(user.uid);
          console.log('Reminders rescheduled due to database changes');
        } catch (error) {
          console.error('Error rescheduling reminders:', error);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setNotificationsEnabled(granted);
    if (!granted && NotificationService.getPermission() === 'denied') {
      alert('Notifications are blocked. Please enable them in your system settings to receive alerts.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">TC</span>
            </div>
            <h1 className="text-xl font-black text-gray-900">TimeCue</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {!notificationsEnabled && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleRequestPermission}
                className="px-3 py-1.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                Enable Notifications
              </motion.button>
            )}
            <button
              onClick={() => signOut(auth)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <ReminderList />
      </main>

      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-400 text-xs">
        <p>&copy; 2026 TimeCue. Built with React & Firebase.</p>
      </footer>
    </div>
  );
}
