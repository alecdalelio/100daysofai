import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';

interface LogEntry {
  day: number;
  title: string;
  summary: string;
  content: string;
  is_published: boolean;
}

interface CreateLogEntryFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const CreateLogEntryForm = ({ onSuccess, onError }: CreateLogEntryFormProps) => {
  const { userId } = useAuth();
  const [formData, setFormData] = useState<LogEntry>({
    day: 1,
    title: '',
    summary: '',
    content: '',
    is_published: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: keyof LogEntry, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload: Record<string, unknown> = { ...formData };
      if (userId) payload.user_id = userId;
      
      const { data, error } = await supabase
        .from('logs')
        .insert([payload])
        .select();

      if (error) {
        throw error;
      }

      setMessage({ type: 'success', text: 'Log entry created successfully!' });
      setFormData({
        day: 1,
        title: '',
        summary: '',
        content: '',
        is_published: false,
      });
      
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create log entry';
      setMessage({ type: 'error', text: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glow-primary hover:glow-electric transition-all duration-500">
      <CardHeader>
        <CardTitle className="gradient-text-electric">Create New Log Entry</CardTitle>
        <CardDescription>
          Add a new entry to your #100DaysOfAI journey
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Message Display */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full glow-primary hover:glow-electric transition-all duration-300 hover-lift"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Entry...
              </>
            ) : (
              'Create Log Entry'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateLogEntryForm; 