import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { nextEligiblePublish } from '@/lib/eligibility';
import { useAuth } from '@/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { LogEntry } from '@/lib/types';
// Removed updateLogEntry import - using direct Supabase calls instead
import LogComposer from './LogComposer';

type EditLog = {
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

interface EditLogEntryFormProps {
  entry: LogEntry;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const EditLogEntryForm = ({ entry, onSuccess, onError, onCancel }: EditLogEntryFormProps) => {
  const { userId } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EditLog>({
    day: entry.day,
    title: entry.title,
    summary: entry.summary || '',
    content: entry.content,
    is_published: entry.is_published,
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [publishDisabled, setPublishDisabled] = useState<boolean>(false);
  const [nextEligibleText, setNextEligibleText] = useState<string | null>(null);
  const [useAIComposer, setUseAIComposer] = useState(false);

  const handleInputChange = (field: keyof EditLog, value: string | number | boolean) => {
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
          .neq('id', entry.id) // Exclude current entry
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
      } catch {
        // Ignore errors in publish check
      }
    })();
  }, [userId, profile?.time_zone, entry.id]);

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

      console.log('[DEBUG] Validation passed, making direct update...');
      
      // Use direct Supabase call to avoid the hanging updateLogEntry function
      const { data, error } = await supabase
        .from('logs')
        .update({
          day: formData.day,
          title: formData.title.trim(),
          summary: formData.summary?.trim() || null,
          content: formData.content.trim(),
          is_published: formData.is_published,
        })
        .eq('id', entry.id)
        .eq('user_id', userId)
        .select('id, day, is_published')
        .single();
      
      if (error) {
        console.error('[DEBUG] Direct update error:', error);
        throw new Error(`Failed to update log entry: ${error.message}`);
      }
      
      console.log('[DEBUG] Direct update succeeded:', data);
      console.log('[Log] updated', data);
      window.dispatchEvent(new CustomEvent('log:changed', { detail: { id: entry.id } }));
      setOkMsg('Entry updated!');
      onSuccess?.();
      // Navigate back to the log entry page
      navigate(`/log/${entry.id}`);
    } catch (err: unknown) {
      console.error('[DEBUG] onSubmit error caught:', err);
      console.error('[DEBUG] Error type:', typeof err);
      console.error('[DEBUG] Error properties:', Object.getOwnPropertyNames(err));
      console.error('[Log] update error', err);
      const code = (err as { code?: string })?.code;
      if (code === '23505') {
        const tz = profile?.time_zone || 'UTC';
        const { pretty } = nextEligiblePublish(tz);
        const message = `You've already published for today. Next eligible: ${pretty}.`;
        setErrorMsg(message);
        onError?.(message);
        return;
      }
      const message = (err as { message?: string } | null)?.message || 'Could not update entry';
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
        <CardTitle className="gradient-text-electric">Edit Log Entry</CardTitle>
        <CardDescription>
          Update your #100DaysOfAI journey entry
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
            initialData={{
              day: formData.day,
              title: formData.title,
              summary: formData.summary,
              content: formData.content,
              is_published: formData.is_published,
            }}
            onSave={async (payload) => {
              setSubmitting(true);
              setErrorMsg(null);
              setOkMsg(null);
              try {
                // Use direct Supabase call
                const { data, error } = await supabase
                  .from('logs')
                  .update({
                    day: payload.day,
                    title: payload.title.trim(),
                    summary: payload.summary?.trim() || null,
                    content: payload.content.trim(),
                    is_published: payload.is_published,
                  })
                  .eq('id', entry.id)
                  .eq('user_id', userId)
                  .select('id, day, is_published')
                  .single();
                
                if (error) {
                  throw new Error(`Failed to update log entry: ${error.message}`);
                }
                
                console.log('[Log] updated', data);
                window.dispatchEvent(new CustomEvent('log:changed', { detail: { id: entry.id } }));
                setOkMsg('Entry updated!');
                onSuccess?.();
                navigate(`/log/${entry.id}`);
              } catch (err: unknown) {
                console.error('[Log] update error', err);
                const code = (err as { code?: string })?.code;
                if (code === '23505') {
                  const tz = profile?.time_zone || 'UTC';
                  const { pretty } = nextEligiblePublish(tz);
                  const message = `You've already published for today. Next eligible: ${pretty}.`;
                  setErrorMsg(message);
                  onError?.(message);
                  return;
                }
                const message = (err as { message?: string } | null)?.message || 'Could not update entry';
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

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 glow-primary hover:glow-electric transition-all duration-300 hover-lift"
                size="lg"
              >
                {submitting ? 'Updating Entry…' : 'Update Log Entry'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default EditLogEntryForm;
