import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Reminder } from '../../types';
import { formatDate, normalizeToMinute } from '../../lib/utils';
import { CheckCircle2, Circle, Trash2, Clock, MoreVertical, Bell, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReminderItemProps {
  reminder: Reminder;
  key?: string;
}

export function ReminderItem({ reminder }: ReminderItemProps) {
  const [showSnooze, setShowSnooze] = useState(false);
  const [isCustomSnooze, setIsCustomSnooze] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const toggleComplete = async () => {
    await updateDoc(doc(db, 'reminders', reminder.id), {
      isCompleted: !reminder.isCompleted
    });
  };

  const toggleNotifications = async () => {
    await updateDoc(doc(db, 'reminders', reminder.id), {
      notificationsEnabled: !reminder.notificationsEnabled
    });
  };

  const deleteReminder = async () => {
    await deleteDoc(doc(db, 'reminders', reminder.id));
  };

  const snooze = async (minutes: number) => {
    const newTime = normalizeToMinute(new Date(Date.now() + minutes * 60000));
    await updateDoc(doc(db, 'reminders', reminder.id), {
      scheduledAt: newTime.toISOString(),
      snoozedAt: new Date().toISOString()
    });
    setShowSnooze(false);
  };

  const handleCustomSnooze = async () => {
    if (!customDate || !customTime) return;
    const newTime = normalizeToMinute(new Date(`${customDate}T${customTime}`));
    await updateDoc(doc(db, 'reminders', reminder.id), {
      scheduledAt: newTime.toISOString(),
      snoozedAt: new Date().toISOString()
    });
    setShowSnooze(false);
    setIsCustomSnooze(false);
  };

  const isOverdue = new Date(reminder.scheduledAt) < new Date() && !reminder.isCompleted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative bg-white p-5 rounded-3xl border transition-all hover:shadow-lg ${
        reminder.isCompleted ? 'border-gray-100 opacity-60' : isOverdue ? 'border-red-100 bg-red-50/30' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={toggleComplete}
          className={`mt-1 transition-colors ${
            reminder.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'
          }`}
        >
          {reminder.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold truncate ${reminder.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {reminder.title}
          </h3>
          {reminder.description && (
            <p className={`text-sm mt-1 line-clamp-2 ${reminder.isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
              {reminder.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-3">
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {formatDate(new Date(reminder.scheduledAt))}
            </div>
            {reminder.snoozedAt && (
              <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                <Bell className="w-3 h-3" />
                Snoozed
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 transition-opacity">
          <button
            onClick={toggleNotifications}
            className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${
              reminder.notificationsEnabled ? 'text-blue-600' : 'text-gray-400'
            }`}
            title={reminder.notificationsEnabled ? 'Notifications on' : 'Notifications off'}
          >
            {reminder.notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              setShowSnooze(!showSnooze);
              setIsCustomSnooze(false);
            }}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 transition-colors"
            title="Snooze reminder"
          >
            <Clock className="w-5 h-5" />
          </button>
          <button
            onClick={async () => {
              if (window.confirm('Delete this reminder?')) {
                await deleteReminder();
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-600 transition-colors"
            title="Delete reminder"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSnooze && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4 pt-4 border-t border-gray-100"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Snooze for:</p>
            {!isCustomSnooze ? (
              <div className="grid grid-cols-4 gap-2">
                {[5, 15, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => snooze(mins)}
                    className="py-2 px-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-sm font-semibold rounded-xl transition-colors border border-gray-100"
                  >
                    {mins < 60 ? `${mins}m` : '1h'}
                  </button>
                ))}
                <button
                  onClick={() => setIsCustomSnooze(true)}
                  className="py-2 px-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-sm font-semibold rounded-xl transition-colors border border-gray-100"
                >
                  Custom
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                  <input
                    type="time"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCustomSnooze}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsCustomSnooze(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
