import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, Share2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import FloatingCounter from "@/components/ui/floating-counter";
import { supabase } from "@/lib/supabase";
import { LogEntry } from "@/lib/types";

const DailyLog = () => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const maxDay = useMemo(() => (entries.length ? Math.max(...entries.map((e) => e.day || 0)) : 0), [entries]);

  useEffect(() => {
    async function fetchPublished() {
      setLoading(true);
      setErrorMsg(null);

      const TIMEOUT_MS = 15000;
      const withTimeout = <T,>(p: Promise<T>) =>
        Promise.race([
          p,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out. Please try again.")), TIMEOUT_MS)
          ),
        ]);

      try {
        const query = supabase
          .from('logs')
          .select('id, day, title, content, created_at, is_published')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        const { data, error } = await withTimeout(query);

        if (error) throw error;
        setEntries((data as LogEntry[]) ?? []);
      } catch (err) {
        const errorObj = err as { message?: string }
        const message = errorObj?.message || 'Failed to load logs';
        setErrorMsg(message);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPublished();
  }, []);

  const handleShare = (entry: LogEntry) => {
    const url = `${window.location.origin}/log/${entry.id}`;
    navigator.clipboard.writeText(url);
    // You could show a toast here
  };

  return (
    <>
      <FloatingCounter />
      <div className="min-h-screen pt-20 relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-20" />
        
        <div className="px-6 py-16 relative">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="mb-6">
                <span className="gradient-text-electric">Daily Log</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                100 days of learning, building, and sharing insights about AI-native development.
                Raw thoughts, discoveries, and experiments from the frontier.
              </p>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="mb-6">
                <Alert variant="destructive">
                  <AlertTitle>Could not load logs</AlertTitle>
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Entries */}
            <div className="space-y-12">
              {loading ? (
                <Card className="glow-primary hover:glow-electric transition-all duration-500 hover-lift">
                  <CardContent className="py-16 text-center">Loading…</CardContent>
                </Card>
              ) : entries.length > 0 ? (
                entries.map((entry, index) => (
                  <Link key={entry.id ?? index} to={`/log/${entry.id}`} className="block">
                  <Card 
                    className="glow-primary hover:glow-electric transition-all duration-500 group hover-lift cursor-pointer"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
                            Day {entry.day}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                            <Calendar className="w-4 h-4" />
                            {entry.created_at ? new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </div>
                        </div>
                        
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(entry); }}
                              className="h-8 w-8 p-0 hover-lift"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                      </div>
                      
                      <CardTitle className="text-2xl md:text-3xl group-hover:gradient-text-cyber transition-all duration-500 leading-tight">
                        {entry.title}
                      </CardTitle>
                    </CardHeader>
                  
                    <CardContent className="space-y-6">
                      <div className="prose prose-invert max-w-none">
                        {(entry.content ?? '').split('\n').map((paragraph, idx) => {
                          if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                            return (
                              <h4 key={idx} className="text-lg font-semibold mt-6 mb-2 text-electric">
                                {paragraph.slice(2, -2)}
                              </h4>
                            );
                          }
                          if (paragraph.startsWith('- ')) {
                            return (
                              <li key={idx} className="ml-4 text-muted-foreground">
                                {paragraph.slice(2)}
                              </li>
                            );
                          }
                          if (paragraph.trim()) {
                            return (
                              <p key={idx} className="text-foreground leading-relaxed">
                                {paragraph}
                              </p>
                            );
                          }
                          return <br key={idx} />;
                        })}
                      </div>
                    </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="glow-primary hover:glow-electric transition-all duration-500 hover-lift">
                  <CardContent className="py-16 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="p-6 rounded-full bg-electric/10">
                        <Calendar className="w-12 h-12 text-electric" />
                      </div>
                      <div className="max-w-md">
                        <h3 className="text-2xl font-semibold mb-4">Ready to Start Your Journey</h3>
                        <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                          Your first log entry will appear here once you begin your #100DaysOfAI challenge. 
                          Create your first entry to get started.
                        </p>
                        <Button asChild size="lg" className="glow-primary hover:glow-electric">
                          <Link to="/new-log">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Entry
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Progress indicator */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-4 p-6 rounded-xl bg-accent/20 border border-border hover-lift glow-primary">
                <span className="text-sm text-muted-foreground font-medium">Progress</span>
                <div className="w-48 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-electric to-cyber transition-all duration-500 animate-shimmer"
                    style={{ width: `${(maxDay / 100) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-bold">{maxDay}/100 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DailyLog;