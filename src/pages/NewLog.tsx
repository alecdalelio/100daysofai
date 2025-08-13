import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/auth/AuthProvider';
import LogComposer from '@/components/LogComposer';

const NewLog = () => {
  const { userId } = useAuth();
  const [useAIComposer, setUseAIComposer] = useState(true);
  const [basicFormData, setBasicFormData] = useState({
    day: 1,
    title: '',
    summary: '',
    content: '',
    is_published: false
  });

  const handleBasicFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving basic form:', basicFormData);
    alert('Basic form saved! (This is a test)');
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
              onSave={async (payload) => {
                console.log('Saving AI composer log:', payload);
                alert('AI composer log saved! (This is a test)');
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
                className="w-full glow-primary hover:glow-electric transition-all duration-300 hover-lift"
                size="lg"
              >
                Create Log Entry
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewLog; 