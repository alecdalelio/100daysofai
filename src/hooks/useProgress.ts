import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Progress = { day: number; percent: number };

const cacheKey = (uid: string) => `progress:${uid}`;

export function useProgress(opts: { countDrafts?: boolean } = {}) {
  const { countDrafts = false } = opts; // default to published-only
  const [progress, setProgress] = useState<Progress>({ day: 0, percent: 0 });
  const [loading, setLoading] = useState(true);
  const uidRef = useRef<string | null>(null);

  const hydrate = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id || null;
    uidRef.current = uid;
    if (!uid) {
      setProgress({ day: 0, percent: 0 });
      setLoading(false);
      return;
    }

    const raw = localStorage.getItem(cacheKey(uid));
    if (raw) {
      try {
        const cached = JSON.parse(raw) as Progress;
        setProgress(cached);
      } catch {}
    }
  }, []);

  const fetchNow = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id || null;
    uidRef.current = uid;
    if (!uid) return;

    setLoading(true);
    const q = supabase
      .from('logs')
      .select('day_key')
      .eq('user_id', uid)
      .eq('is_published', true);

    const { data: rows, error } = await q;
    if (error) {
      console.error('[useProgress] fetch error', error);
      setLoading(false);
      return;
    }
    const dates = new Set<string>();
    (rows as any)?.forEach((r: { day_key?: string | null }) => {
      if (r?.day_key) dates.add(r.day_key);
    });
    const day = dates.size;
    const next = { day, percent: Math.min(100, Math.max(0, Math.round((day / 100) * 100))) };
    setProgress(next);
    try { localStorage.setItem(cacheKey(uid), JSON.stringify(next)); } catch {}
    setLoading(false);
  }, [countDrafts]);

  useEffect(() => { hydrate().then(fetchNow); }, [hydrate, fetchNow]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => { hydrate().then(fetchNow); });
    return () => data?.subscription?.unsubscribe();
  }, [hydrate, fetchNow]);

  useEffect(() => {
    let ch: any;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return;
      ch = supabase
        .channel(`logs:${uid}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'logs', filter: `user_id=eq.${uid}` },
          () => fetchNow()
        )
        .subscribe();
    })();
    return () => ch?.unsubscribe();
  }, [fetchNow]);

  useEffect(() => {
    const bump = () => fetchNow();
    window.addEventListener('log:changed', bump);
    return () => window.removeEventListener('log:changed', bump);
  }, [fetchNow]);

  const refresh = useCallback(() => fetchNow(), [fetchNow]);

  return { ...progress, loading, refresh };
}


