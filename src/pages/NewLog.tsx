import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import LogComposer from '@/components/LogComposer';
import { saveLogEntry, type LogEntryData } from '@/lib/saveLogs';
import { useProgress } from '@/hooks/useProgress';

const NewLog = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { day: currentDay } = useProgress({ countDrafts: true });
  const nextDay = currentDay + 1;
  
  const [useAIComposer, setUseAIComposer] = useState(true);
  const [basicFormData, setBasicFormData] = useState({
    day: nextDay,
    title: '',
    summary: '',
    content: '',
    is_published: false
  });
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isBasicFormSaving, setIsBasicFormSaving] = useState(false);
  
  // Update the day when progress changes
  useEffect(() => {
    setBasicFormData(prev => ({ ...prev, day: nextDay }));
  }, [nextDay]);

  const handleBasicFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBasicFormSaving(true);
    setSaveStatus({ type: null, message: '' });
    
    try {
      const result = await saveLogEntry({
        day: basicFormData.day,
        title: basicFormData.title,
        summary: basicFormData.summary,
        content: basicFormData.content,
        is_published: basicFormData.is_published
      });
      
      if (result.success) {
        setSaveStatus({ type: 'success', message: 'Log entry saved successfully!' });
        
        // Navigate to the created log after a short delay
        setTimeout(() => {
          if (basicFormData.is_published && result.logId) {
            navigate(`/log/${result.logId}`);
          } else {
            navigate('/my/logs');
          }
        }, 1500);
      } else {
        setSaveStatus({ type: 'error', message: result.error || 'Failed to save log entry' });
      }
    } catch (error) {
      console.error('Error saving basic form:', error);
      setSaveStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsBasicFormSaving(false);
    }
  };

  const handleBasicFormChange = (field: string, value: string | number | boolean) => {
    setBasicFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
              onSave={async (payload: LogEntryData) => {
                console.log('Saving AI composer log:', payload);
                setSaveStatus({ type: null, message: '' });
                
                try {
                  const result = await saveLogEntry(payload);
                  
                  if (result.success) {
                    setSaveStatus({ type: 'success', message: `Day ${payload.day} log entry ${payload.is_published ? 'published' : 'saved'} successfully!` });
                    
                    // Navigate to the created log after a short delay
                    setTimeout(() => {
                      if (payload.is_published && result.logId) {
                        navigate(`/log/${result.logId}`);
                      } else {
                        navigate('/my/logs');
                      }
                    }, 1500);
                  } else {
                    throw new Error(result.error || 'Failed to save log entry');
                  }
                } catch (error) {
                  console.error('Error saving AI composer log:', error);
                  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                  setSaveStatus({ type: 'error', message: errorMessage });
                  throw error; // Re-throw so LogComposer can handle it too
                }
              }}
            />
          ) : (
            <form onSubmit={handleBasicFormSubmit} className="space-y-6">
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
                  value={basicFormData.day}
                  onChange={(e) => handleBasicFormChange('day', parseInt(e.target.value) || 1)}
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
                  value={basicFormData.title}
                  onChange={(e) => handleBasicFormChange('title', e.target.value)}
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
                  value={basicFormData.summary}
                  onChange={(e) => handleBasicFormChange('summary', e.target.value)}
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
                  value={basicFormData.content}
                  onChange={(e) => handleBasicFormChange('content', e.target.value)}
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
                  checked={basicFormData.is_published}
                  onCheckedChange={(checked) => handleBasicFormChange('is_published', checked)}
                />
                <Label htmlFor="is_published" className="text-sm font-medium">
                  Publish Entry
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isBasicFormSaving}
                className="w-full glow-primary hover:glow-electric transition-all duration-300 hover-lift"
                size="lg"
              >
                {isBasicFormSaving ? 'Saving...' : 'Create Log Entry'}
              </Button>
            </form>
          )}
        </CardContent>
        
        {/* Success/Error Messages */}
        {saveStatus.type && (
          <div className="mt-6">
            <Alert variant={saveStatus.type === 'error' ? 'destructive' : 'default'}>
              {saveStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {saveStatus.message}
                {saveStatus.type === 'success' && ' Redirecting...'}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NewLog; 