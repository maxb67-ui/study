import { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Check, Trash2, Calendar, BookOpen, AlertTriangle, Zap, X, Settings as SettingsIcon, Flag } from 'lucide-react';
import type { AppNotification, NotificationPreferences, ReminderType } from '@/lib/notifications';
import { saveNotifications, getNotificationPrefs, saveNotificationPrefs, requestBrowserPermission, getSavedNotifications } from '@/lib/notifications';
import type { View } from '@/App';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';

const TYPE_ICONS: Record<ReminderType, typeof Bell> = {
  session: Calendar,
  exam: AlertTriangle,
  assignment: BookOpen,
  overdue: Zap,
  task_high: Flag,
};

const TYPE_COLORS: Record<ReminderType, string> = {
  session: 'text-primary-500 bg-primary-50 dark:bg-primary-950/40',
  exam: 'text-accent-500 bg-accent-50 dark:bg-accent-950/40',
  assignment: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40',
  overdue: 'text-error-500 bg-error-50 dark:bg-error-950/40',
  task_high: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40',
};

export function NotificationCenter({
  setView,
  notifications,
  setNotifications,
}: {
  setView: (v: View) => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const initialPrefs = useMemo(() => getNotificationPrefs(user?.id || ''), [user?.id]);
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPrefs);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function markAllAsRead() {
    if (!user?.id) return;
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(user.id, updated);
  }

  function clearAll() {
    if (!user?.id) return;
    setNotifications([]);
    saveNotifications(user.id, []);
  }

  function handleNotifClick(notif: AppNotification) {
    if (!user?.id) return;
    if (!notif.read) {
      const updated = notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
      setNotifications(updated);
      saveNotifications(user.id, updated);
    }
    if (notif.actionView) {
      setView(notif.actionView);
      setOpen(false);
    }
  }

  async function handleToggleBrowser() {
    if (!user?.id) return;
    if (!prefs.browserNotifications) {
      const granted = await requestBrowserPermission();
      if (!granted) {
        toast('error', 'Browser notification permission denied');
        return;
      }
      toast('success', 'Browser notifications enabled');
    }
    const updated = { ...prefs, browserNotifications: !prefs.browserNotifications };
    setPrefs(updated);
    saveNotificationPrefs(user.id, updated);
  }

  function updatePref<K extends keyof NotificationPreferences>(key: K, val: NotificationPreferences[K]) {
    if (!user?.id) return;
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    saveNotificationPrefs(user.id, updated);
    toast('info', 'Notification preferences saved');
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-error-500 ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 card p-4 shadow-xl border border-neutral-200 dark:border-neutral-800 animate-scale-in">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Reminders & Alerts</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-xs font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn-ghost p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                title="Notification Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="btn-ghost p-1.5 text-neutral-400 hover:text-error-500"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {showSettings ? (
            <div className="space-y-3 py-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-700 dark:text-neutral-200">Browser Push Notifications</span>
                <button
                  onClick={handleToggleBrowser}
                  className={`w-9 h-5 rounded-full relative transition-colors ${prefs.browserNotifications ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${prefs.browserNotifications ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>

              <div>
                <label className="label text-[10px]">Advance Reminder Timing</label>
                <select
                  value={prefs.advanceMinutes}
                  onChange={(e) => updatePref('advanceMinutes', Number(e.target.value))}
                  className="input py-1.5 text-xs"
                >
                  <option value={15}>15 Minutes Before</option>
                  <option value={30}>30 Minutes Before</option>
                  <option value={60}>1 Hour Before</option>
                  <option value={1440}>1 Day Before</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <p className="label text-[10px]">Reminder Categories</p>
                {[
                  { key: 'notifyExams', label: 'Upcoming Exams' },
                  { key: 'notifyAssignments', label: 'Assignments Due Soon' },
                  { key: 'notifySessions', label: 'Scheduled Study Sessions' },
                  { key: 'notifyOverdue', label: 'Overdue Items' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between text-neutral-600 dark:text-neutral-300 cursor-pointer">
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(prefs[item.key as keyof NotificationPreferences])}
                      onChange={(e) => updatePref(item.key as keyof NotificationPreferences, e.target.checked)}
                      className="rounded text-primary-500 focus:ring-primary-400"
                    />
                  </label>
                ))}
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="btn-secondary w-full py-1.5 mt-2 text-xs"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">No active notifications</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((notif) => {
                    const Icon = TYPE_ICONS[notif.type] || Bell;
                    const colorClass = TYPE_COLORS[notif.type] || 'text-primary-500 bg-primary-50';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`p-2.5 rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                          notif.read
                            ? 'bg-neutral-50/50 dark:bg-neutral-800/30 opacity-70 hover:opacity-100'
                            : 'bg-primary-50/40 dark:bg-primary-950/20 border border-primary-200/50 dark:border-primary-800/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{notif.title}</p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mt-0.5">{notif.message}</p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="w-full text-center text-xs text-primary-600 dark:text-primary-400 font-medium pt-3 mt-2 border-t border-neutral-200 dark:border-neutral-800 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}