import { useState, useEffect } from 'react';
import { User as UserIcon, GraduationCap, School, BookOpen, Lock, Plus, X, Check, Save, LogOut, Mail, Brain, Target } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

const GRADE_LEVELS = [
  'Middle School',
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'AP / Honors',
  'Undergraduate',
  'Graduate',
  'Other',
];

export function AccountView() {
  const { user, profile, updateProfile, updatePassword, signOut, refreshProfile } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [studyGoals, setStudyGoals] = useState('');
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setGradeLevel(profile.grade_level ?? '');
      setSchoolName(profile.school_name ?? '');
      setClasses(profile.classes ?? []);
      setLearningStyle(profile.learning_style ?? '');
      setStudyGoals(profile.study_goals ?? '');
    }
  }, [profile]);

  async function saveProfile() {
    const cleanName = fullName.trim().slice(0, 100);
    if (!cleanName) {
      toast('error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    const { error } = await updateProfile({
      full_name: cleanName,
      grade_level: gradeLevel ? gradeLevel.slice(0, 50) : null,
      school_name: schoolName.trim() ? schoolName.trim().slice(0, 100) : null,
      classes: classes.slice(0, 20),
      learning_style: learningStyle ? learningStyle.slice(0, 50) : null,
      study_goals: studyGoals.trim() ? studyGoals.trim().slice(0, 1000) : null,
    });
    setSaving(false);
    if (error) {
      toast('error', 'Failed to save profile');
    } else {
      toast('success', 'Profile saved');
    }
  }

  function addClass() {
    const trimmed = newClass.trim().slice(0, 50);
    if (!trimmed) return;
    if (classes.length >= 20) {
      toast('error', 'Maximum 20 classes allowed');
      return;
    }
    if (classes.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast('error', 'That class is already in your list');
      return;
    }
    setClasses([...classes, trimmed]);
    setNewClass('');
  }

  function removeClass(cls: string) {
    setClasses(classes.filter((c) => c !== cls));
  }

  async function changePassword() {
    if (newPassword.length < 6 || newPassword.length > 72) {
      toast('error', 'Password must be between 6 and 72 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('error', 'Passwords do not match');
      return;
    }
    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    setChangingPassword(false);
    if (error) {
      toast('error', error);
    } else {
      toast('success', 'Password updated');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasChanges =
    fullName !== profile.full_name ||
    gradeLevel !== (profile.grade_level ?? '') ||
    schoolName !== (profile.school_name ?? '') ||
    JSON.stringify(classes) !== JSON.stringify(profile.classes ?? []) ||
    learningStyle !== (profile.learning_style ?? '') ||
    studyGoals !== (profile.study_goals ?? '');

  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader title="Account" subtitle="Manage your profile and security" />

      <div className="card p-5 mb-6 animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {(profile.full_name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
              {profile.full_name || 'Student'}
            </h2>
            <div className="flex items-center gap-1.5 text-sm text-neutral-400 dark:text-neutral-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-primary-500" />
          Profile Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="input pl-10"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Grade Level</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="input pl-10"
                >
                  <option value="">Select grade</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">School / Institution</label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  maxLength={100}
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Your school"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Classes / Subjects</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  maxLength={50}
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addClass();
                    }
                  }}
                  placeholder="e.g. Calculus, AP Physics..."
                  className="input pl-10"
                />
              </div>
              <button onClick={addClass} className="btn-secondary px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {classes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => (
                  <span
                    key={cls}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-sm font-medium animate-scale-in"
                  >
                    {cls}
                    <button
                      onClick={() => removeClass(cls)}
                      className="text-primary-400 hover:text-error-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">No classes added yet. Add subjects to organize your tasks.</p>
            )}
          </div>

          <div>
            <label className="label">Learning Style</label>
            <div className="relative">
              <Brain className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value)}
                className="input pl-10"
              >
                <option value="">Select style</option>
                <option value="visual">Visual</option>
                <option value="auditory">Auditory</option>
                <option value="reading">Reading/Writing</option>
                <option value="kinesthetic">Kinesthetic</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Study Goals</label>
            <div className="relative">
              <Target className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
              <textarea
                value={studyGoals}
                maxLength={1000}
                onChange={(e) => setStudyGoals(e.target.value)}
                placeholder="e.g. Pass all AP exams with A's..."
                className="input pl-10 min-h-[60px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={saveProfile}
              disabled={saving || !hasChanges}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Check className="w-4 h-4 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>
            {hasChanges && (
              <button
                onClick={refreshProfile}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-500" />
          Security
        </h3>

        <div className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              maxLength={72}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Between 6 and 72 characters"
              className="input"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              maxLength={72}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="input"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="btn-secondary justify-center w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPassword ? 'Updating...'<dyad-write path="src/components/views/AccountView.tsx" description="Complete AccountView with input length constraints and security validation">
import { useState, useEffect } from 'react';
import { User as UserIcon, GraduationCap, School, BookOpen, Lock, Plus, X, Check, Save, LogOut, Mail, Brain, Target } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

const GRADE_LEVELS = [
  'Middle School',
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'AP / Honors',
  'Undergraduate',
  'Graduate',
  'Other',
];

export function AccountView() {
  const { user, profile, updateProfile, updatePassword, signOut, refreshProfile } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [newClass, setNewClass] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [studyGoals, setStudyGoals] = useState('');
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setGradeLevel(profile.grade_level ?? '');
      setSchoolName(profile.school_name ?? '');
      setClasses(profile.classes ?? []);
      setLearningStyle(profile.learning_style ?? '');
      setStudyGoals(profile.study_goals ?? '');
    }
  }, [profile]);

  async function saveProfile() {
    const cleanName = fullName.trim().slice(0, 100);
    if (!cleanName) {
      toast('error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    const { error } = await updateProfile({
      full_name: cleanName,
      grade_level: gradeLevel ? gradeLevel.slice(0, 50) : null,
      school_name: schoolName.trim() ? schoolName.trim().slice(0, 100) : null,
      classes: classes.slice(0, 20),
      learning_style: learningStyle ? learningStyle.slice(0, 50) : null,
      study_goals: studyGoals.trim() ? studyGoals.trim().slice(0, 1000) : null,
    });
    setSaving(false);
    if (error) {
      toast('error', 'Failed to save profile');
    } else {
      toast('success', 'Profile saved');
    }
  }

  function addClass() {
    const trimmed = newClass.trim().slice(0, 50);
    if (!trimmed) return;
    if (classes.length >= 20) {
      toast('error', 'Maximum 20 classes allowed');
      return;
    }
    if (classes.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast('error', 'That class is already in your list');
      return;
    }
    setClasses([...classes, trimmed]);
    setNewClass('');
  }

  function removeClass(cls: string) {
    setClasses(classes.filter((c) => c !== cls));
  }

  async function changePassword() {
    if (newPassword.length < 6 || newPassword.length > 72) {
      toast('error', 'Password must be between 6 and 72 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('error', 'Passwords do not match');
      return;
    }
    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    setChangingPassword(false);
    if (error) {
      toast('error', error);
    } else {
      toast('success', 'Password updated');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const hasChanges =
    fullName !== profile.full_name ||
    gradeLevel !== (profile.grade_level ?? '') ||
    schoolName !== (profile.school_name ?? '') ||
    JSON.stringify(classes) !== JSON.stringify(profile.classes ?? []) ||
    learningStyle !== (profile.learning_style ?? '') ||
    studyGoals !== (profile.study_goals ?? '');

  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader title="Account" subtitle="Manage your profile and security" />

      <div className="card p-5 mb-6 animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {(profile.full_name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
              {profile.full_name || 'Student'}
            </h2>
            <div className="flex items-center gap-1.5 text-sm text-neutral-400 dark:text-neutral-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-primary-500" />
          Profile Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="input pl-10"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Grade Level</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="input pl-10"
                >
                  <option value="">Select grade</option>
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">School / Institution</label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  maxLength={100}
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Your school"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Classes / Subjects</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  maxLength={50}
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addClass();
                    }
                  }}
                  placeholder="e.g. Calculus, AP Physics..."
                  className="input pl-10"
                />
              </div>
              <button onClick={addClass} className="btn-secondary px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {classes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => (
                  <span
                    key={cls}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-sm font-medium animate-scale-in"
                  >
                    {cls}
                    <button
                      onClick={() => removeClass(cls)}
                      className="text-primary-400 hover:text-error-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">No classes added yet. Add subjects to organize your tasks.</p>
            )}
          </div>

          <div>
            <label className="label">Learning Style</label>
            <div className="relative">
              <Brain className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value)}
                className="input pl-10"
              >
                <option value="">Select style</option>
                <option value="visual">Visual</option>
                <option value="auditory">Auditory</option>
                <option value="reading">Reading/Writing</option>
                <option value="kinesthetic">Kinesthetic</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Study Goals</label>
            <div className="relative">
              <Target className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
              <textarea
                value={studyGoals}
                maxLength={1000}
                onChange={(e) => setStudyGoals(e.target.value)}
                placeholder="e.g. Pass all AP exams with A's..."
                className="input pl-10 min-h-[60px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={saveProfile}
              disabled={saving || !hasChanges}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Check className="w-4 h-4 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>
            {hasChanges && (
              <button
                onClick={refreshProfile}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-500" />
          Security
        </h3>

        <div className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              maxLength={72}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Between 6 and 72 characters"
              className="input"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              maxLength={72}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="input"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="btn-secondary justify-center w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      <div className="card p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <LogOut className="w-4 h-4 text-neutral-500" />
          Session
        </h3>
        <button
          onClick={handleSignOut}
          className="btn w-full justify-center bg-error-500 text-white hover:bg-error-600 px-4 py-2.5 text-sm shadow-soft"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}