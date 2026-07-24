import { useEffect, useState, useCallback } from 'react';
import type { Settings } from './supabase';
import { supabase } from './supabase';
import { useAuth } from './auth';

const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'user_id'> = {
  dark_mode: false,
  daily_goal_minutes: 120,
  study_start_time: '08:00',
  study_end_time: '22:00',
  break_duration_minutes: 5,
  pomodoro_length_minutes: 25,
  reminders_enabled: true,
  updated_at: new Date().toISOString(),
};

export function useSettings() {
  const { session } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    ...DEFAULT_SETTINGS,
    id: '',
    user_id: '',
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (data) {
      setSettings(data as Settings);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(async (patch: Partial<Settings>) => {
    if (!session?.user) return;
    const next = { ...settings, ...patch, updated_at: new Date().toISOString() };
    setSettings(next);
    const { id, user_id, updated_at, ...rest } = next;
    void id;
    void user_id;
    void updated_at;
    await supabase
      .from('settings')
      .update(rest)
      .eq('user_id', session.user.id);
  }, [settings, session]);

  return { settings, loading, update, reload: load };
}
