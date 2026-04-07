import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/auth/AuthForm';
import { ReminderList } from './components/reminders/ReminderList';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { LogOut, Bell, BellOff, Loader2 } from 'lucide-react';
import { NotificationService } from './services/notificationService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Reminder } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, loading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(NotificationService.getPermission() === 'granted');
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'reminders'),
        where('userId', '==', user.uid),
        where('isCompleted', '==', false)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reminder[];
        setReminders(data);
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user && reminders.length > 0) {
      const checkReminders = () => {
        const now = new Date();
        reminders.forEach((reminder) => {
          const scheduledAt = new Date(reminder.scheduledAt);
          if (reminder.notificationsEnabled && scheduledAt <= now && !notifiedIds.has(reminder.id)) {
            NotificationService.showNotification(`TimeCue: ${reminder.title}`, {
              body: reminder.description || 'Your reminder is due now!',
              tag: reminder.id
            });
            setNotifiedIds(prev => new Set(prev).add(reminder.id));
          }
        });
      };

      checkReminders(); // Initial check
      const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [user, reminders, notifiedIds]);

  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setNotificationsEnabled(granted);
    if (!granted && NotificationService.getPermission() === 'denied') {
      alert('Notifications are blocked. Please enable them in your browser settings to receive alerts.');
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
