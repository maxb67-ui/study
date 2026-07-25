import type { Task, StudyBlock, Settings } from './supabase';
import { localDateISO, daysBetween } from './dates';
import { encryptData, decryptData } from './crypto';

export type ReminderType = 'session' | 'exam' | 'assignment' | 'overdue' | 'task_high';

export type AppNotification = {
  id: string;
  type: ReminderType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionView?: 'tasks' | 'calendar' | 'pomodoro';
  taskId?: string;
};

export type NotificationPreferences = {
  advanceMinutes: number;
  notifyExams: boolean;
  notifyAssignments: boolean;
  notifySessions: boolean;
  notifyOverdue: boolean;
  notifyHighPriority: boolean;
  browserNotifications: boolean;
};

const BASE_KEY_NOTIFS = 'lumora_notifications_v1';
const BASE_KEY_PREFS = 'lumora_notification_prefs_v1';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  advanceMinutes: 30,
  notifyExams: true,
  notifyAssignments: true,
  notifySessions: true,
  notifyOverdue: true,
  notifyHighPriority: true,
  browserNotifications: false,
};

export function getNotificationPrefs(userId: string): NotificationPreferences {
  if (!userId) return DEFAULT_NOTIFICATION_PREFS;
  try {
    const saved = localStorage.getItem(`${BASE_KEY_PREFS}_${userId}`);
    if (saved) {
      const decrypted = decryptData(saved, userId);
      return decrypted ? { ...DEFAULT_NOTIFICATION_PREFS, ...decrypted } : DEFAULT_NOTIFICATION_PREFS;
    }
  } catch {}
  return DEFAULT_NOTIFICATION_PREFS;
}

export function saveNotificationPrefs(userId: string, prefs: NotificationPreferences): void {
  if (!userId) return;
  try {
    const encrypted = encryptData(prefs, userId);
    localStorage.setItem(`${BASE_KEY_PREFS}_${userId}`, encrypted);
  } catch {}
}

export function getSavedNotifications(userId: string): AppNotification[] {
  if (!userId) return [];
  try {
    const saved = localStorage.getItem(`${BASE_KEY_NOTIFS}_${userId}`);
    if (saved) {
      const decrypted = decryptData(saved, userId);
      return decrypted || [];
    }
  } catch {}
  return [];
}

export function saveNotifications(userId: string, notifs: AppNotification[]): void {
  if (!userId) return;
  try {
    const sanitized = notifs.slice(0, 30).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read,
      actionView: n.actionView,
      taskId: n.taskId,
    }));
    const encrypted = encryptData(sanitized, userId);
    localStorage.setItem(`${BASE_KEY_NOTIFS}_${userId}`, encrypted);
  } catch {}
}

export function clearSavedNotifications(userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(`${BASE_KEY_NOTIFS}_${userId}`);
    localStorage.removeItem(`${BASE_KEY_PREFS}_${userId}`);
  } catch {}
}

export async function requestBrowserPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission();
    return res === 'granted';
  }
  return false;
}

export function triggerBrowserNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/vite.svg',
    });
  } catch {}
}

export function scanForReminders(
  userId: string,
  tasks: Task[],
  blocks: StudyBlock[],
  settings: Settings,
  showToast: (type: 'info' | 'error' | 'success', msg: string) => void,
): AppNotification[] {
  if (!userId) return [];
  const prefs = getNotificationPrefs(userId);
  const existing = getSavedNotifications(userId);
  const existingIds = new Set(existing.map((n) => n.id));

  const newNotifs: AppNotification[] = [];
  const today = new Date();
  const todayISO = localDateISO(today);

  if (prefs.notifySessions) {
    const todayBlocks = blocks.filter((b) => b.scheduled_date === todayISO && !b.completed);
    for (const b of todayBlocks) {
      const task = tasks.find((t) => t.id === b.task_id);
      const id = `session-${b.id}-${todayISO}`;
      if (!existingIds.has(id)) {
        const title = 'Study Session Scheduled';
        const msg = `Session for "${task?.title || 'Assignment'}" at ${b.start_time.slice(0, 5)} (${b.duration_minutes}m)`;
        const item: AppNotification = {
          id,
          type: 'session',
          title,
          message: msg,
          timestamp: new Date().toISOString(),
          read: false,
          actionView: 'calendar',
          taskId: b.task_id,
        };
        newNotifs.push(item);
        if (prefs.browserNotifications) triggerBrowserNotification(title, msg);
      }
    }
  }

  if (prefs.notifyExams) {
    const exams = tasks.filter((t) => !t.completed && t.type === 'exam');
    for (const exam of exams) {
      const daysLeft = daysBetween(today, new Date(exam.due_date));
      if (daysLeft >= 0 && daysLeft <= 2) {
        const id = `exam-${exam.id}-${daysLeft}d`;
        if (!existingIds.has(id)) {
          const title = `🚨 Upcoming Exam: ${exam.subject}`;
          const msg = `"${exam.title}" is due ${daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}`;
          const item: AppNotification = {
            id,
            type: 'exam',
            title,
            message: msg,
            timestamp: new Date().toISOString(),
            read: false,
            actionView: 'tasks',
            taskId: exam.id,
          };
          newNotifs.push(item);
          if (prefs.browserNotifications) triggerBrowserNotification(title, msg);
        }
      }
    }
  }

  if (prefs.notifyHighPriority) {
    const highTasks = tasks.filter((t) => !t.completed && t.priority >= 4);
    for (const t of highTasks) {
      const id = `high-task-${t.id}-${todayISO}`;
      if (!existingIds.has(id)) {
        const title = 'Priority Task Reminder';
        const msg = `Don't forget to work on "${t.title}". It's marked as high priority.`;
        newNotifs.push({
          id,
          type: 'task_high',
          title,
          message: msg,
          timestamp: new Date().toISOString(),
          read: false,
          actionView: 'tasks',
          taskId: t.id,
        });
      }
    }
  }

  if (prefs.notifyOverdue) {
    const overdue = tasks.filter((t) => !t.completed && localDateISO(new Date(t.due_date)) < todayISO);
    if (overdue.length > 0) {
      const id = `overdue-batch-${todayISO}`;
      if (!existingIds.has(id)) {
        const title = '⚠️ Overdue Items Warning';
        const msg = `You have ${overdue.length} overdue item${overdue.length > 1 ? 's' : ''} needing attention.`;
        newNotifs.push({
          id,
          type: 'overdue',
          title,
          message: msg,
          timestamp: new Date().toISOString(),
          read: false,
          actionView: 'tasks',
        });
      }
    }
  }

  if (newNotifs.length > 0) {
    const combined = [...newNotifs, ...existing];
    saveNotifications(userId, combined);
    showToast('info', `🔔 ${newNotifs.length} new study reminder${newNotifs.length > 1 ? 's' : ''}`);
    return combined;
  }

  return existing;
}