import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, restFetch } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

type NewLog = {
  day: number;
  title: string;
  summary: string;
  content: string;
  is_published: boolean;
};

async function createLogEntry(input: NewLog, opts?: { userId?: string }) {
  // Resolve user id using provided value first, then fall back to session/user with timeouts
  let resolvedUserId: string | null = opts?.userId ?? null;
  const resolveUserId = async (): Promise<string> => {
    if (resolvedUserId) return resolvedUserId;
    const timeout = (ms: number) => new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Auth timed out')), ms));
    // Try getSession quickly
    try {
      const sessionResult = (await Promise.race([
        supabase.auth.getSession(),
        timeout(2500),
      ])) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
      const sid = sessionResult?.data?.session?.user?.id;
      if (sid) return sid;
    } catch {}
    // Fallback to getUser
    const userResult = (await Promise.race([
      supabase.auth.getUser(),
      timeout(2500),
    ])) as Awaited<ReturnType<typeof supabase.auth.getUser>>;
    if (userResult.error || !userResult.data?.user) throw new Error('Not signed in');
    return userResult.data.user.id;
  };

  const userId = await resolveUserId();

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
    };

    // Use direct REST to avoid any supabase-js client stalls
    const resp = await restFetch(`/logs?select=id,day,is_published`, {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload),
      timeoutMs: 7000,
    });
    const text = await resp.text();
    console.log('[logs.insert][REST] status', resp.status, text);
    if (!resp.ok) {
      const err = new Error(text || `Insert failed (${resp.status})`);
      // attach crude code for duplication if present
      if (/23505/.test(text)) (err as any).code = '23505';
      throw err;
    }
    const rows = text ? JSON.parse(text) : [];
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row as { id: string; day: number; is_published: boolean };
  };

  try {
    return await Promise.race([write(), timeout(7000)]);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string } | undefined;
    if (err?.code === '23505') {
      throw new Error('You already have a log for that day.');
    }
    throw new Error(err?.message || 'Create failed');
  }
}

interface CreateLogEntryFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const CreateLogEntryForm = ({ onSuccess, onError }: CreateLogEntryFormProps) => {
  const { userId } = useAuth();
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

  const handleInputChange = (field: keyof NewLog, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault?.();
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

      const res = await createLogEntry({
        day: formData.day,
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        is_published: formData.is_published,
      }, { userId: userId ?? undefined });
      console.log('[Log] created', res);
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
      console.error('[Log] create error', err);
      const message = (err as { message?: string } | null)?.message || 'Could not create entry';
      const errorMessage = message;
      setErrorMsg(errorMessage);
      onError?.(errorMessage);
    } finally {
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
              checked={formData.is_published}
              onCheckedChange={(checked) => handleInputChange('is_published', checked)}
            />
            <Label htmlFor="is_published" className="text-sm font-medium">
              Publish Entry
            </Label>
            {formData.is_published && (
              <Badge variant="secondary" className="ml-2">
                Public
              </Badge>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full glow-primary hover:glow-electric transition-all duration-300 hover-lift"
            size="lg"
          >
            {submitting ? 'Creating Entry…' : 'Create Log Entry'}
          </Button>
          {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
          {okMsg && <p className="text-green-500 mt-2">{okMsg}</p>}
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateLogEntryForm; 