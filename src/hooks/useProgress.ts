import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type Progress = { day: number; percent: number; loading: boolean; error?: string };

export function useProgress() {
  const [state, setState] = useState<Progress>({ day: 0, percent: 0, loading: true });

  const fetchNow = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: undefined }));
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id;
    if (!uid) { setState({ day: 0, percent: 0, loading: false }); return; }

    const { data, error } = await supabase
      .from('logs')
      .select('day')
      .eq('user_id', uid)
      .eq('is_published', true)
      .order('day', { ascending: false })
      .limit(1);

    if (error) { setState({ day: 0, percent: 0, loading: false, error: error.message }); return; }

    const maxDay = (data as Array<{ day?: number }> | null)?.[0]?.day ?? 0;
    const percent = Math.min(100, Math.round((maxDay / 100) * 100));
    setState({ day: maxDay, percent, loading: false });
  }, []);

  useEffect(() => { fetchNow(); }, [fetchNow]);

  useEffect(() => {
    const { data: sub } = supabase
      .channel('progress-logs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'logs'
      }, () => fetchNow())
      .subscribe();
    return () => { sub?.unsubscribe?.(); };
  }, [fetchNow]);

  const refresh = fetchNow;

  return { ...state, refresh };
}


