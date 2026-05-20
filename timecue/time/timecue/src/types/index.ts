export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  scheduledAt: string; // ISO string
  createdAt: string; // ISO string
  isCompleted: boolean;
  notificationsEnabled: boolean;
  snoozedAt?: string; // ISO string
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}