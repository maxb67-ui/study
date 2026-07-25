import type { Task, StudyBlock, Settings } from './supabase';
import { localDateISO, daysBetween } from './dates';

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

const STORAGE_KEY_NOTIFS = 'lumora_notifications_v1';
const STORAGE_KEY_PREFS = 'lumora_notification_prefs_v1';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  advanceMinutes: 30,
  notifyExams: true,
  notifyAssignments: true,
  notifySessions: true,
  notifyOverdue: true,
  notifyHighPriority: true,
  browserNotifications: false,
};

export function getNotificationPrefs(): NotificationPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFS);
    if (saved) return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_NOTIFICATION_PREFS;
}

export function saveNotificationPrefs(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
  } catch {}
}

export function getSavedNotifications(): AppNotification[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function saveNotifications(notifs: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifs.slice(0, 50)));
  } catch {}
}

export function clearSavedNotifications(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    localStorage.removeItem(STORAGE_KEY_PREFS);
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
  tasks: Task[],
  blocks: StudyBlock[],
  settings: Settings,
  showToast: (type: 'info' | 'error' | 'success', msg: string) => void,
): AppNotification[] {
  const prefs = getNotificationPrefs();
  const existing = getSavedNotifications();
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
    saveNotifications(combined);
    showToast('info', `🔔 ${newNotifs.length} new study reminder${newNotifs.length > 1 ? 's' : ''}`);
    return combined;
  }

  return existing;
}