import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Reminder } from '../../types';
import { ReminderItem } from './ReminderItem';
import { ReminderForm } from './ReminderForm';
import { Plus, ListFilter, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ReminderList() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('scheduledAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reminder[];
      setReminders(data);
    });

    return unsubscribe;
  }, []);

  const filteredReminders = reminders.filter(r => {
    if (filter === 'active') return !r.isCompleted;
    if (filter === 'completed') return r.isCompleted;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900">My Reminders</h2>
          <p className="text-gray-500 font-medium">You have {reminders.filter(r => !r.isCompleted).length} active tasks</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`p-2 rounded-xl transition-all ${filter === 'all' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <ListFilter className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`p-2 rounded-xl transition-all ${filter === 'active' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <CalendarIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`p-2 rounded-xl transition-all ${filter === 'completed' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredReminders.map(reminder => (
            <ReminderItem key={reminder.id} reminder={reminder} />
          ))}
        </AnimatePresence>
        
        {filteredReminders.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold">No reminders found</p>
            <p className="text-gray-400 text-sm">Tap the + button to create one</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-300 flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all active:scale-95 z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      <AnimatePresence>
        {showForm && <ReminderForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}
