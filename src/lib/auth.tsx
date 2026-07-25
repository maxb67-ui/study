"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, type Profile } from './supabase';
import { clearSavedNotifications } from './notifications';
import { clearErrorLogs } from './errorHandler';
import { clearAcademicGoals } from './goals';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: (global?: boolean) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string, currentPassword: string) => Promise<{ error: string | null }>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER_KEY = 'lumora_demo_user';
const IS_PROD = import.meta.env.PROD;

function clearAllUserData(userId?: string): void {
  try {
    if (userId) {
      clearAcademicGoals(userId);
      clearSavedNotifications(userId);
    }
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem('lumora_unlocked_achievements_v1');
    sessionStorage.clear();
    clearErrorLogs();
  } catch (e) {
    console.warn('Cleanup failed during sign out', e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo] = useState(!isSupabaseConfigured && !IS_PROD);

  const loadProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!error && data) setProfile(data as Profile);
    } catch (e) {
      console.warn('Profile load failed', e);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      if (IS_PROD) {
        setLoading(false);
        return;
      }
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSession(parsed.session);
          setProfile(parsed.profile);
        } catch {
          localStorage.removeItem(DEMO_USER_KEY);
        }
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) loadProfile(newSession.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) return { error: IS_PROD ? 'Database not configured' : null };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: IS_PROD ? 'Database not configured' : null };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }, []);

  const signOut = useCallback(async (global: boolean = false) => {
    const userId = session?.user?.id;
    clearAllUserData(userId);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut({ scope: global ? 'global' : 'local' });
    }
    setSession(null);
    setProfile(null);
  }, [session]);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: IS_PROD ? 'Database not configured' : null };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    return { error: error?.message || null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string, currentPassword: string) => {
    if (!isSupabaseConfigured) return { error: 'Not supported in demo mode' };
    if (!currentPassword || !currentPassword.trim()) {
      return { error: 'Current password is required to verify your identity.' };
    }
    if (!session?.user?.email) {
      return { error: 'No active session found. Please re-authenticate.' };
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    });
    if (reauthError) return { error: 'Incorrect current password. Re-authentication failed.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message || null };
  }, [session]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (isDemo) {
      setProfile((p) => (p ? { ...p, ...patch } : null));
      return { error: null };
    }
    if (!session?.user) return { error: 'No session' };
    const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
    if (!error) await loadProfile(session.user.id);
    return { error: error?.message || null };
  }, [session, isDemo, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isDemo,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
};