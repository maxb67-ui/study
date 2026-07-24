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

  // Helper to construct a local demo session
  const createDemoSession = (email: string, fullName: string): { session: Session; profile: Profile } => {
    const userId = 'demo-user-id';
    const fakeUser: User = {
      id: userId,
      app_metadata: {},
      user_metadata: { full_name: fullName },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email,
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
      full_name: fullName || 'Demo Student',
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
      // Check local storage for demo user
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
    if (!isSupabaseConfigured) {
      // Demo mode fallback signup
      const { session: demoSession, profile: demoProfile } = createDemoSession(email, fullName);
      demoProfile.onboarded = false; // Trigger onboarding view for new signup
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ session: demoSession, profile: demoProfile }));
      setSession(demoSession);
      setProfile(demoProfile);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { error: error.message };

      if (data.user) {
        // Create initial profile if trigger hasn't completed
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            onboarded: false,
          });
        } catch {}
      }

      return { error: null };
    } catch (err: unknown) {
      // Fallback to local session on network error/Failed to fetch
      console.warn('Network auth failed, entering demo mode:', err);
      const { session: demoSession, profile: demoProfile } = createDemoSession(email, fullName);
      demoProfile.onboarded = false;
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ session: demoSession, profile: demoProfile }));
      setSession(demoSession);
      setProfile(demoProfile);
      setIsDemo(true);
      return { error: null };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const { session: demoSession, profile: demoProfile } = createDemoSession(email, 'Student');
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ session: demoSession, profile: demoProfile }));
      setSession(demoSession);
      setProfile(demoProfile);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: unknown) {
      console.warn('Sign-in failed, continuing in demo mode:', err);
      const { session: demoSession, profile: demoProfile } = createDemoSession(email, 'Student');
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ session: demoSession, profile: demoProfile }));
      setSession(demoSession);
      setProfile(demoProfile);
      setIsDemo(true);
      return { error: null };
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    setSession(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: null };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: null };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!isSupabaseConfigured) return { error: null };
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: null };
    }
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
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