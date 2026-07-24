import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, type Profile } from './supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER_KEY = 'lumora_demo_user';
const LOCAL_NOTES_KEY = 'lumora_local_notes_v1';
const LOCAL_NOTIFS_KEY = 'lumora_notifications_v1';

const ALLOWED_PROFILE_KEYS: (keyof Profile)[] = [
  'full_name',
  'grade_level',
  'school_name',
  'classes',
  'avatar_url',
  'learning_style',
  'study_goals',
  'onboarded',
];

function sanitizeProfilePatch(patch: Partial<Profile>): Partial<Profile> {
  const clean: Partial<Profile> = {};
  for (const key of ALLOWED_PROFILE_KEYS) {
    if (key in patch) {
      (clean as any)[key] = patch[key];
    }
  }
  return clean;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(!isSupabaseConfigured);

  const loadProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (e) {
      console.warn('Could not load online profile:', e);
    }
  }, []);

  const createDemoSession = (email: string, fullName: string): { session: Session; profile: Profile } => {
    const userId = 'demo-user-id';
    const fakeUser: User = {
      id: userId,
      app_metadata: {},
      user_metadata: { full_name: fullName.slice(0, 100) },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email.slice(0, 100),
    };
    const fakeSession: Session = {
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh',
      user: fakeUser,
    };
    const fakeProfile: Profile = {
      id: userId,
      full_name: fullName.slice(0, 100) || 'Demo Student',
      grade_level: 'Senior',
      school_name: null,
      classes: ['Calculus', 'Physics', 'Literature'],
      avatar_url: null,
      learning_style: 'visual',
      study_goals: 'Achieve high marks across all classes',
      onboarded: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { session: fakeSession, profile: fakeProfile };
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
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
      setIsDemo(true);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setIsDemo(true);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim().slice(0, 100);

    if (!isValidEmail(cleanEmail)) {
      return { error: 'Please enter a valid email address.' };
    }
    if (password.length < 6 || password.length > 72) {
      return { error: 'Password must be between 6 and 72 characters.' };
    }

    if (!isSupabaseConfigured) {
      const { session: demoSession, profile: demoProfile } = createDemoSession(cleanEmail, cleanName);
      demoProfile.onboarded = false;
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ session: demoSession, profile: demoProfile }));
      setSession(demoSession);
      setProfile(demoProfile);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: cleanName } },
      });
      if (error) return { error: error.message };

      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: cleanName,
            onboarded: false,
          });
        } catch {}
      }

      return { error: null };
    } catch (err: unknown) {
      console.warn('Network auth failed, entering demo mode:', err);
      const { session: demoSession, profile: demoProfile } = createDemoSession(cleanEmail, cleanName);
      demoProfile.onboarded = false;
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ session: demoSession, profile: demoProfile }));
      setSession(demoSession);
      setProfile(demoProfile);
      setIsDemo(true);
      return { error: null };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return { error: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured) {
      const { session: demoSession, profile: demoProfile } = createDemoSession(cleanEmail, 'Student');
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ session: demoSession, profile: demoProfile }));
      setSession(demoSession);
      setProfile(demoProfile);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: unknown) {
      console.warn('Sign-in failed, continuing in demo mode:', err);
      const { session: demoSession, profile: demoProfile } = createDemoSession(cleanEmail, 'Student');
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ session: demoSession, profile: demoProfile }));
      setSession(demoSession);
      setProfile(demoProfile);
      setIsDemo(true);
      return { error: null };
    }
  }, []);

  const signOut = useCallback(async () => {
    // Clear user-specific storage on sign out
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(LOCAL_NOTES_KEY);
    localStorage.removeItem(LOCAL_NOTIFS_KEY);

    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    setSession(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return { error: 'Please enter a valid email address.' };
    }
    if (!isSupabaseConfigured) return { error: null };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: null };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (newPassword.length < 6 || newPassword.length > 72) {
      return { error: 'Password must be between 6 and 72 characters.' };
    }
    if (!isSupabaseConfigured) return { error: null };
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: null };
    }
  }, []);

  const updateProfile = useCallback(async (rawPatch: Partial<Profile>) => {
    const patch = sanitizeProfilePatch(rawPatch);
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));

    if (isDemo || !session?.user) {
      const current = localStorage.getItem(DEMO_USER_KEY);
      if (current) {
        try {
          const parsed = JSON.parse(current);
          parsed.profile = { ...parsed.profile, ...patch };
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(parsed));
        } catch {}
      }
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', session.user.id);
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }, [session, isDemo]);

  const refreshProfile = useCallback(async () => {
    if (session?.user && isSupabaseConfigured) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value: AuthContextValue = {
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}