import { useState, useEffect } from 'react';
import { 
  User as UserIcon, GraduationCap, School, BookOpen, Lock, Plus, X, Check, Save, 
  LogOut, Mail, Brain, Target, Moon, Sun, Monitor, Bell, Shield, Trash2, 
  ChevronRight, Sparkles, Clock, Eye, Download, Info
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';
import { useSettings } from '@/lib/useSettings';
import { getNotificationPrefs, saveNotificationPrefs, type NotificationPreferences, requestBrowserPermission } from '@/lib/notifications';

const GRADE_LEVELS = [
  'Middle School', 'Freshman', 'Sophomore', 'Junior', 'Senior',
  'AP / Honors', 'Undergraduate', 'Graduate', 'Other',
];

type SettingsSection = 'profile' | 'study' | 'appearance' | 'notifications' | 'privacy' | 'account';

export function AccountView() {
  const { user, profile, updateProfile, updatePassword, signOut, refreshProfile } = useAuth();
  const { settings, update: updateSettings } = useSettings();
  const toast = useToast();

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  // Profile State
  const [fullName, setFullName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [studyGoals, setStudyGoals] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Study State
  const [dailyGoal, setDailyGoal] = useState(120);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [pomoLen, setPomoLen] = useState(25);
  const [breakDur, setBreakDur] = useState(5);
  const [savingStudy, setSavingStudy] = useState(false);

  // Notifications State
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(getNotificationPrefs());

  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setGradeLevel(profile.grade_level ?? '');
      setSchoolName(profile.school_name ?? '');
      setClasses(profile.classes ?? []);
      setLearningStyle(profile.learning_style ?? '');
      setStudyGoals(profile.study_goals ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setDailyGoal(settings.daily_goal_minutes);
      setStartTime(settings.study_start_time.slice(0, 5));
      setEndTime(settings.study_end_time.slice(0, 5));
      setPomoLen(settings.pomodoro_length_minutes);
      setBreakDur(settings.break_duration_minutes);
    }
  }, [settings]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      grade_level: gradeLevel || null,
      school_name: schoolName.trim() || null,
      classes,
      learning_style: learningStyle || null,
      study_goals: studyGoals.trim() || null,
    });
    setSavingProfile(false);
    if (error) toast('error', 'Failed to save profile');
    else toast('success', 'Profile updated successfully');
  }

  async function handleSaveStudy() {
    setSavingStudy(true);
    await updateSettings({
      daily_goal_minutes: dailyGoal,
      study_start_time: startTime + ':00',
      study_end_time: endTime + ':00',
      pomodoro_length_minutes: pomoLen,
      break_duration_minutes: breakDur,
    });
    setSavingStudy(false);
    toast('success', 'Study preferences saved');
  }

  function updateNotifPref<K extends keyof NotificationPreferences>(key: K, val: NotificationPreferences[K]) {
    const updated = { ...notifPrefs, [key]: val };
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
    toast('info', 'Notification preferences updated');
  }

  async function handleToggleBrowserNotifs() {
    if (!notifPrefs.browserNotifications) {
      const granted = await requestBrowserPermission();
      if (!granted) {
        toast('error', 'Permission denied for browser notifications');
        return;
      }
    }
    updateNotifPref('browserNotifications', !notifPrefs.browserNotifications);
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast('error', 'Passwords do not match');
      return;
    }
    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    setChangingPassword(false);
    if (error) toast('error', error);
    else {
      toast('success', 'Password updated');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  const sections = [
    { id: 'profile', label: 'Personal Profile', icon: UserIcon, color: 'text-primary-500' },
    { id: 'study', label: 'Study & Planning', icon: Target, color: 'text-accent-500' },
    { id: 'appearance', label: 'Theme & Style', icon: Sun, color: 'text-warning-500' },
    { id: 'notifications', label: 'Reminders', icon: Bell, color: 'text-indigo-500' },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield, color: 'text-success-500' },
    { id: 'account', label: 'Security & Login', icon: Lock, color: 'text-error-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader title="Settings" subtitle="Manage your academic profile and application preferences" />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="flex lg:flex-col overflow-x-auto no-scrollbar gap-1 bg-neutral-100/50 dark:bg-neutral-800/30 p-1 rounded-2xl">
            {sections.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id as SettingsSection)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap lg:w-full ${
                    active 
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700' 
                      : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? s.color : ''}`} />
                  {s.label}
                </button> section
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-indigo-500/10 border border-primary-500/20 hidden lg:block">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider">Pro Tip</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Tailoring your learning style and study window helps our AI generate more effective schedules for your routine.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6 animate-fade-in" key={activeSection}>
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Display Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Your name" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Grade Level</label>
                      <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="input">
                        {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Institution</label>
                      <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="input" placeholder="University or School" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Academic Context</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Learning Style Preference</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'].map(style => (
                        <button
                          key={style}
                          onClick={() => setLearningStyle(style)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                            learningStyle === style 
                              ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800 text-primary-600'
                              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-500'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Semester Study Goals</label>
                    <textarea 
                      value={studyGoals} 
                      onChange={(e) => setStudyGoals(e.target.value)} 
                      className="input min-h-[100px] resize-none" 
                      placeholder="e.g. Maintain 4.0 GPA, master Calculus III..." 
                    />
                  </div>
                  <div>
                    <label className="label">Active Classes</label>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        value={newClass} 
                        onChange={(e) => setNewClass(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setClasses([...classes, newClass]), setNewClass(''))}
                        className="input" 
                        placeholder="Add a class..." 
                      />
                      <button 
                        onClick={() => { if(newClass) { setClasses([...classes, newClass]); setNewClass(''); } }}
                        className="btn-secondary px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {classes.map(c => (
                        <span key={c} className="chip bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {c}
                          <X className="w-3 h-3 cursor-pointer hover:text-error-500" onClick={() => setClasses(classes.filter(i => i !== c))} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary px-8">
                  {savingProfile ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

          {activeSection === 'study' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-950/30 flex items-center justify-center text-accent-500">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">Planning Algorithms</h3>
                    <p className="text-xs text-neutral-500">Configure how Lumora generates your daily schedule</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">Daily Study Goal</label>
                      <span className="text-sm font-bold text-primary-600">{Math.round(dailyGoal / 60 * 10) / 10} hours</span>
                    </div>
                    <input type="range" min="30" max="600" step="15" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))} className="w-full accent-primary-500" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Study Window Start</label>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Study Window End</label>
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Pomodoro Duration</label>
                      <div className="flex items-center gap-3">
                        <input type="number" value={pomoLen} onChange={(e) => setPomoLen(Number(e.target.value))} className="input" />
                        <span className="text-xs font-bold text-neutral-400">min</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Break Duration</label>
                      <div className="flex items-center gap-3">
                        <input type="number" value={breakDur} onChange={(e) => setBreakDur(Number(e.target.value))} className="input" />
                        <span className="text-xs font-bold text-neutral-400">min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSaveStudy} disabled={savingStudy} className="btn-primary px-8">
                  {savingStudy ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Preferences
                </button>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="card p-6">
              <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Interface Theme</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light Mode', icon: Sun, val: false },
                  { id: 'dark', label: 'Dark Mode', icon: Moon, val: true },
                  { id: 'system', label: 'System', icon: Monitor, val: 'system' },
                ].map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => updateSettings({ dark_mode: theme.val === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme.val as boolean })}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                      (theme.val === 'system' ? false : settings.dark_mode === theme.val)
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <theme.icon className={`w-8 h-8 ${ (theme.val === 'system' ? false : settings.dark_mode === theme.val) ? 'text-primary-500' : 'text-neutral-400'}`} />
                    <span className="text-sm font-bold">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">Push Notifications</h3>
                    <p className="text-xs text-neutral-500">Receive alerts directly in your browser</p>
                  </div>
                  <button
                    onClick={handleToggleBrowserNotifs}
                    className={`w-12 h-6 rounded-full relative transition-colors ${notifPrefs.browserNotifications ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${notifPrefs.browserNotifications ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="label">Reminder Timing</label>
                  <select 
                    value={notifPrefs.advanceMinutes} 
                    onChange={(e) => updateNotifPref('advanceMinutes', Number(e.target.value))}
                    className="input"
                  >
                    <option value={15}>15 minutes before session</option>
                    <option value={30}>30 minutes before session</option>
                    <option value={60}>1 hour before session</option>
                    <option value={1440}>1 day before deadline</option>
                  </select>

                  <div className="pt-4 space-y-3">
                    {[
                      { key: 'notifyExams', label: 'Upcoming Exams & Tests', desc: 'Critical alerts 48h before exams' },
                      { key: 'notifyAssignments', label: 'Assignment Deadlines', desc: 'Daily reminders for due items' },
                      { key: 'notifySessions', label: 'Study Session Alerts', desc: 'Alerts when it is time to focus' },
                      { key: 'notifyOverdue', label: 'Overdue Task Warnings', desc: 'Alerts for missed study blocks' },
                    ].map(item => (
                      <div key={item.key} className="flex items-start justify-between py-2">
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">{item.label}</p>
                          <p className="text-[11px] text-neutral-500">{item.desc}</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={Boolean(notifPrefs[item.key as keyof NotificationPreferences])}
                          onChange={(e) => updateNotifPref(item.key as keyof NotificationPreferences, e.target.checked)}
                          className="rounded text-primary-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Data Visibility</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Public Academic Profile</p>
                      <p className="text-xs text-neutral-500">Allow others to see your level and achievements</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700 relative">
                      <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-1" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Analytics Sharing</p>
                      <p className="text-xs text-neutral-500">Share anonymized study habits to improve AI</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-primary-500 relative">
                      <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-7" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="card p-6 border-primary-100 dark:border-primary-900/30">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Your Data</h3>
                <div className="space-y-3">
                  <button className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-left">
                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-primary-500" />
                      <span className="text-sm font-medium">Export Study Logs (CSV)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </button>
                  <button className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-left">
                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-primary-500" />
                      <span className="text-sm font-medium">Export Notes (JSON)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Security & Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" placeholder="Min 6 characters" />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" placeholder="Confirm password" />
                  </div>
                  <button onClick={handleChangePassword} disabled={changingPassword} className="btn-secondary w-full">
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              <div className="card p-6 border-error-200 dark:border-error-900/30">
                <h3 className="font-bold text-error-600 dark:text-error-400 mb-4">Danger Zone</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-error-50 dark:bg-error-950/20 text-error-700 dark:text-error-300">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      Deleting your account will permanently remove all your tasks, study logs, notes, and achievement data. This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={signOut} className="btn-secondary flex-1">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                    <button className="btn bg-error-500 text-white hover:bg-error-600 flex-1 px-4 py-2.5 text-sm shadow-soft">
                      <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}