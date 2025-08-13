import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, restFetch } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { nextEligiblePublish } from '@/lib/eligibility';
import { useAuth } from '@/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import LogComposer from './LogComposer';

type NewLog = {
  day: number;
  title: string;
  summary: string;
  content: string;
  is_published: boolean;
  tags?: string[];
  tools?: string[];
  minutes?: number;
  mood?: string;
};

async function createLogEntry(input: NewLog, opts?: { userId?: string }) {
  console.log('[DEBUG] createLogEntry called with:', { input, opts });
  
  // Resolve user id using provided value first, then fall back to session/user with timeouts
  let resolvedUserId: string | null = opts?.userId ?? null;
  const resolveUserId = async (): Promise<string> => {
    console.log('[DEBUG] Resolving user ID...');
    if (resolvedUserId) {
      console.log('[DEBUG] Using provided user ID:', resolvedUserId);
      return resolvedUserId;
    }
    const timeout = (ms: number) => new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Auth timed out')), ms));
    // Try getSession quickly
    try {
      console.log('[DEBUG] Attempting getSession...');
      const sessionResult = (await Promise.race([
        supabase.auth.getSession(),
        timeout(2500),
      ])) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
      console.log('[DEBUG] getSession result:', { 
        hasSession: !!sessionResult?.data?.session,
        hasUser: !!sessionResult?.data?.session?.user,
        userId: sessionResult?.data?.session?.user?.id,
        sessionExpiry: sessionResult?.data?.session?.expires_at
      });
      const sid = sessionResult?.data?.session?.user?.id;
      if (sid) return sid;
    } catch (err) {
      console.log('[DEBUG] getSession failed:', err);
    }
    // Fallback to getUser
    console.log('[DEBUG] Falling back to getUser...');
    const userResult = (await Promise.race([
      supabase.auth.getUser(),
      timeout(2500),
    ])) as Awaited<ReturnType<typeof supabase.auth.getUser>>;
    console.log('[DEBUG] getUser result:', { 
      hasError: !!userResult.error, 
      hasUser: !!userResult.data?.user,
      userId: userResult.data?.user?.id,
      error: userResult.error?.message
    });
    if (userResult.error || !userResult.data?.user) throw new Error('Not signed in');
    return userResult.data.user.id;
  };

  const userId = await resolveUserId();
  console.log('[DEBUG] Resolved userId:', userId);

  const timeout = (ms: number) =>
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Request timed out')), ms));

  const write = async () => {
    const payload = {
      user_id: userId,
      day: input.day,
      title: input.title?.trim() || null,
      summary: input.summary?.trim() || null,
      content: input.content?.trim() || null,
      is_published: !!input.is_published,
      tags: input.tags || [],
      tools: input.tools || [],
      minutes_spent: input.minutes || null,
      mood: input.mood || null,
    };

    console.log('[DEBUG] Payload to be sent:', payload);
    console.log('[DEBUG] Making REST call to /logs...');

    // Use direct REST to avoid any supabase-js client stalls
    const resp = await restFetch(`/logs?select=id,day,is_published,created_at`, {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload),
      timeoutMs: 20000,
    });
    
    console.log('[DEBUG] REST response status:', resp.status);
    console.log('[DEBUG] REST response headers:', Object.fromEntries(resp.headers.entries()));
    
    const text = await resp.text();
    console.log('[logs.insert][REST] status', resp.status, text);
    console.log('[DEBUG] Full response body:', text);
    
    if (!resp.ok) {
      console.error('[DEBUG] Request failed with status', resp.status);
      console.error('[DEBUG] Response body:', text);
      const err = new Error(text || `Insert failed (${resp.status})`);
      // attach crude code for duplication if present
      if (/23505/.test(text)) (err as any).code = '23505';
      throw err;
    }
    const rows = text ? JSON.parse(text) : [];
    const row = Array.isArray(rows) ? rows[0] : rows;
    console.log('[DEBUG] Parsed response:', row);
    return row as { id: string; day: number; is_published: boolean; created_at?: string };
  };

  try {
    // Rely on restFetch's own timeout (20s) to avoid double-timeout races
    return await write();
  } catch (e: unknown) {
    console.error('[DEBUG] createLogEntry catch block:', e);
    const err = e as { code?: string; message?: string; status?: number } | undefined;
    
    // Handle specific database constraint violations
    if (err?.code === '23505' || /unique constraint|duplicate key|published.*per.*day/i.test(err?.message ?? '')) {
      throw new Error('You already have a published log for that day.');
    }
    
    // Handle column not found errors (summary field issue)
    if (/column.*does not exist|unknown field/i.test(err?.message ?? '')) {
      throw new Error('Database schema mismatch. Please contact support.');
    }
    
    // Handle auth errors
    if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    
    // Handle RLS errors  
    if (err?.message?.includes('403') || err?.message?.includes('insufficient_privilege') || err?.message?.includes('row-level security')) {
      throw new Error('Permission denied. You may not be signed in properly.');
    }
    
    // Generic error with more context
    const message = err?.message || 'Create failed';
    throw new Error(`Failed to create log entry: ${message}`);
  }
}

interface CreateLogEntryFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const CreateLogEntryForm = ({ onSuccess, onError }: CreateLogEntryFormProps) => {
  const { userId } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<NewLog>({
    day: 1,
    title: '',
    summary: '',
    content: '',
    is_published: false,
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [publishDisabled, setPublishDisabled] = useState<boolean>(false);
  const [nextEligibleText, setNextEligibleText] = useState<string | null>(null);
  const [useAIComposer, setUseAIComposer] = useState(false);

  const handleInputChange = (field: keyof NewLog, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Check if already published for current effective day in user's TZ
  useEffect(() => {
    (async () => {
      try {
        if (!userId) return;
        const tz = profile?.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        // Check if user has any published entry today by date(created_at at tz)
        const today = new Date();
        const y = today.getUTCFullYear();
        const m = String(today.getUTCMonth() + 1).padStart(2, '0');
        const d = String(today.getUTCDate()).padStart(2, '0');
        const isoDay = `${y}-${m}-${d}`;

        const { data: rows, error } = await supabase
          .from('logs')
          .select('id')
          .eq('user_id', userId)
          .eq('is_published', true)
          .gte('created_at', `${isoDay}T00:00:00Z`)
          .lte('created_at', `${isoDay}T23:59:59Z`)
          .limit(1);
        if (!error && rows && rows.length > 0) {
          setPublishDisabled(true);
          const { pretty } = nextEligiblePublish(tz);
          setNextEligibleText(`Next eligible: ${pretty}`);
        } else {
          setPublishDisabled(false);
          setNextEligibleText(null);
        }
      } catch {}
    })();
  }, [userId, profile?.time_zone]);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault?.();
    console.log('[DEBUG] onSubmit called, formData:', formData);
    console.log('[DEBUG] Current userId from auth:', userId);
    
    setSubmitting(true);
    setErrorMsg(null);
    setOkMsg(null);
    try {
      if (!formData.day || formData.day < 1 || formData.day > 100) {
        throw new Error('Day must be between 1 and 100.');
      }
      if (!formData.title?.trim()) {
        throw new Error('Title is required.');
      }

      console.log('[DEBUG] Validation passed, calling createLogEntry...');
      
      // Add master timeout to prevent indefinite hanging
      const masterTimeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out after 10 seconds')), 10000)
      );
      
      const createLogPromise = createLogEntry({
        day: formData.day,
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        is_published: formData.is_published,
      }, { userId: userId ?? undefined });
      
      const res = await Promise.race([createLogPromise, masterTimeout]);
      console.log('[DEBUG] createLogEntry succeeded:', res);
      console.log('[Log] created', res);
      window.dispatchEvent(new CustomEvent('log:changed', { detail: { id: res.id } }));
      setOkMsg('Entry created!');
      setFormData({
        day: 1,
        title: '',
        summary: '',
        content: '',
        is_published: false,
      });
      onSuccess?.();
      // Navigate to the newly created log page
      navigate(`/log/${res.id}`);
    } catch (err: unknown) {
      console.error('[DEBUG] onSubmit error caught:', err);
      console.error('[DEBUG] Error type:', typeof err);
      console.error('[DEBUG] Error properties:', Object.getOwnPropertyNames(err));
      console.error('[Log] create error', err);
      const code = (err as any)?.code as string | undefined;
      if (code === '23505') {
        const tz = profile?.time_zone || 'UTC';
        const { pretty } = nextEligiblePublish(tz);
        const message = `You've already published for today. Next eligible: ${pretty}.`;
        setErrorMsg(message);
        onError?.(message);
        return;
      }
      const message = (err as { message?: string } | null)?.message || 'Could not create entry';
      const errorMessage = message;
      console.log('[DEBUG] Setting error message:', errorMessage);
      setErrorMsg(errorMessage);
      onError?.(errorMessage);
    } finally {
      console.log('[DEBUG] onSubmit finally block, setting submitting to false');
      setSubmitting(false);
    }
  }

  return (
    <Card className="glow-primary hover:glow-electric transition-all duration-500">
      <CardHeader>
        <CardTitle className="gradient-text-electric">Create New Log Entry</CardTitle>
        <CardDescription>
          Add a new entry to your #100DaysOfAI journey
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Toggle between AI Composer and Basic Form */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={useAIComposer ? "outline" : "default"}
            onClick={() => setUseAIComposer(false)}
            className="flex-1"
          >
            Basic Form
          </Button>
          <Button
            variant={useAIComposer ? "default" : "outline"}
            onClick={() => setUseAIComposer(true)}
            className="flex-1"
          >
            AI-Assist Composer
          </Button>
        </div>

        {useAIComposer ? (
          <LogComposer
            onSave={async (payload) => {
              setSubmitting(true);
              setErrorMsg(null);
              setOkMsg(null);
              try {
                const res = await createLogEntry(payload, { userId: userId ?? undefined });
                console.log('[Log] created', res);
                window.dispatchEvent(new CustomEvent('log:changed', { detail: { id: res.id } }));
                setOkMsg('Entry created!');
                onSuccess?.();
                navigate(`/log/${res.id}`);
              } catch (err: unknown) {
                console.error('[Log] create error', err);
                const code = (err as any)?.code as string | undefined;
                if (code === '23505') {
                  const tz = profile?.time_zone || 'UTC';
                  const { pretty } = nextEligiblePublish(tz);
                  const message = `You've already published for today. Next eligible: ${pretty}.`;
                  setErrorMsg(message);
                  onError?.(message);
                  return;
                }
                const message = (err as { message?: string } | null)?.message || 'Could not create entry';
                setErrorMsg(message);
                onError?.(message);
              } finally {
                setSubmitting(false);
              }
            }}
          />
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Day Number */}
            <div className="space-y-2">
              <Label htmlFor="day" className="text-sm font-medium">
                Day Number
              </Label>
              <Input
                id="day"
                type="number"
                min="1"
                max="100"
                value={formData.day}
                onChange={(e) => handleInputChange('day', parseInt(e.target.value) || 1)}
                className="glow-primary focus:glow-electric transition-all duration-300"
                required
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="What did you learn today?"
                className="glow-primary focus:glow-electric transition-all duration-300"
                required
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary" className="text-sm font-medium">
                Summary
              </Label>
              <Input
                id="summary"
                type="text"
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Brief summary of today's learning"
                className="glow-primary focus:glow-electric transition-all duration-300"
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">
                Content
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Detailed content of your learning experience..."
                rows={8}
                className="glow-primary focus:glow-electric transition-all duration-300 resize-none"
                required
              />
            </div>

            {/* Published Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published && !publishDisabled}
                onCheckedChange={(checked) => !publishDisabled && handleInputChange('is_published', checked)}
                disabled={publishDisabled}
              />
              <Label htmlFor="is_published" className="text-sm font-medium">
                Publish Entry
              </Label>
              {formData.is_published && (
                <Badge variant="secondary" className="ml-2">
                  Public
                </Badge>
              )}
              {publishDisabled && nextEligibleText && (
                <span className="text-sm text-muted-foreground ml-2">{nextEligibleText}</span>
              )}
            </div>

            {/* Error/Success Messages */}
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-red-700 dark:text-red-300 text-sm">{errorMsg}</p>
              </div>
            )}
            {okMsg && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3">
                <p className="text-green-700 dark:text-green-300 text-sm">{okMsg}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full glow-primary hover:glow-electric transition-all duration-300 hover-lift"
              size="lg"
            >
              {submitting ? 'Creating Entry…' : 'Create Log Entry'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default CreateLogEntryForm; 