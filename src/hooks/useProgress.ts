import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type Progress = { 
  day: number; 
  percent: number; 
  loading: boolean; 
  error?: string;
  totalEntries?: number;
};

interface UseProgressOptions {
  countDrafts?: boolean;
}

export function useProgress(options: UseProgressOptions = {}) {
  const [state, setState] = useState<Progress>({ day: 0, percent: 0, loading: true });

  const fetchNow = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: undefined }));
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id;
    if (!uid) { setState({ day: 0, percent: 0, loading: false }); return; }

    const query = supabase
      .from('logs')
      .select('day')
      .eq('user_id', uid);

    // If not counting drafts, only get published logs
    if (!options.countDrafts) {
      query.eq('is_published', true);
    }

    const { data, error } = await query
      .order('day', { ascending: false })
      .limit(1);

    if (error) { 
      setState({ day: 0, percent: 0, loading: false, error: error.message }); 
      return; 
    }

    const maxDay = (data as Array<{ day?: number }> | null)?.[0]?.day ?? 0;
    const percent = Math.min(100, Math.round((maxDay / 100) * 100));
    
    // Get total entries count if requested
    let totalEntries = 0;
    if (options.countDrafts) {
      const { count } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid);
      totalEntries = count || 0;
    }

    setState({ 
      day: maxDay, 
      percent, 
      loading: false,
      totalEntries: options.countDrafts ? totalEntries : undefined
    });
  }, [options.countDrafts]);

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