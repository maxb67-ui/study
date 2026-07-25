"use client";

import { useState } from 'react';
import { 
  User as UserIcon, Lock, Save, LogOut, Sun, Moon, Bell, Shield, 
  Trash2, Target, Clock, AlertTriangle, LogOut as LogOutIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';
import { useSettings } from '@/lib/useSettings';

type SettingsSection = 'profile' | 'study' | 'appearance' | 'notifications' | 'account';

export function AccountView() {
  const { user, profile, updateProfile, updatePassword, signOut, isDemo } = useAuth();
  const { settings, update: updateSettings } = useSettings();
  const toast = useToast();

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !currentPassword.trim()) {
      toast('error', 'Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast('error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('error', 'New passwords do not match');
      return;
    }

    setChangingPassword(true);
    const { error } = await updatePassword(newPassword, currentPassword);
    setChangingPassword(false);

    if (error) {
      toast('error', error);
    } else {
      toast('success', 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader title="Settings" subtitle="Manage your profile and security" />

      {isDemo && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            You are in <strong>Demo Mode</strong>. Your data is stored locally and will be lost if you clear your browser cache.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0">
          <div className="flex lg:flex-col overflow-x-auto no-scrollbar gap-1 bg-neutral-100/50 dark:bg-neutral-800/30 p-1 rounded-2xl">
            {(['profile', 'study', 'appearance', 'notifications', 'account'] as const).map((id) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                  activeSection === id 
                    ? 'bg-white dark:bg-neutral-800 text-primary-600 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          {activeSection === 'account' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h3 className="font-bold text-neutral-900 dark:text-white mb-4">Security & Password</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="label">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      className="input" 
                      placeholder="Required for password change" 
                      required
                    />
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="input" 
                      placeholder="At least 6 characters" 
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="input" 
                      placeholder="Repeat new password"
                      required
                    />
                  </div>
                  <button 
                    onClick={handleChangePassword} 
                    disabled={changingPassword || isDemo} 
                    className="btn-primary w-full"
                  >
                    {changingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                  {isDemo && <p className="text-[10px] text-neutral-400 italic">Password changes are disabled in Demo Mode.</p>}
                </div>
              </div>
              
              <div className="card p-6 border-error-100 dark:border-error-950">
                <h3 className="font-bold text-error-600 mb-1">Danger Zone</h3>
                <p className="text-xs text-neutral-500 mb-4">Actions that affect your active sessions and data visibility.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => signOut(false)} className="btn-secondary text-neutral-600 dark:text-neutral-300">
                    <LogOutIcon className="w-4 h-4" /> Sign Out This Device
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm('This will log you out of all devices including your phone and tablet. Continue?')) {
                        signOut(true);
                      }
                    }} 
                    className="btn-secondary text-error-500 border-error-100 hover:bg-error-50"
                  >
                    <Shield className="w-4 h-4" /> Sign Out of All Devices
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'profile' && (
            <div className="card p-6 space-y-4">
              <h3 className="font-bold text-neutral-900 dark:text-white">Profile Details</h3>
              <div>
                <label className="label">Full Name</label>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{profile?.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="label">Grade Level</label>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{profile?.grade_level || 'Not set'}</p>
              </div>
              <div>
                <label className="label">School / Institution</label>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{profile?.school_name || 'Not set'}</p>
              </div>
            </div>
          )}

          {activeSection !== 'account' && activeSection !== 'profile' && (
            <div className="card p-6 text-sm text-neutral-500 italic">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} preferences are active.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}