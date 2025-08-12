import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Share2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import FloatingCounter from "@/components/ui/floating-counter";
import { AuthorDisplay } from "@/components/AuthorDisplay";
import { LogEntry } from "@/lib/types";
import { useProgress } from "@/hooks/useProgress";
import { fetchLogsWithProfiles } from "@/lib/fetchLogsWithProfiles";

const DailyLog = () => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { day: maxDay } = useProgress({ countDrafts: true });

  const fetchPublished = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      console.log('[DailyLog] Starting to fetch published logs...');
      
      const entries = await fetchLogsWithProfiles({
        isPublished: true
      });

      console.log(`[DailyLog] Successfully loaded ${entries.length} entries`);
      setEntries(entries);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('[DailyLog] Failed to fetch logs:', err);
      const errorObj = err as { message?: string; code?: string };
      let message = 'Failed to load logs';
      
      if (errorObj?.code === 'PGRST301') {
        message = 'No published entries found. Check back later!';
      } else if (errorObj?.message) {
        message = errorObj.message.includes('timeout') 
          ? 'Connection is slow. Please check your internet and try again.'
          : errorObj.message;
      }
      
      setErrorMsg(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
                  <AlertDescription className="flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setRetryCount(prev => prev + 1);
                        fetchPublished();
                      }}
                      className="ml-4"
                      disabled={loading}
                    >
                      {loading ? 'Retrying...' : 'Try Again'}
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Entries */}
            <div className="space-y-12">
              {loading ? (
                <>
                  {[...Array(5)].map((_, index) => (
                    <Card key={index} className="glow-primary hover:glow-electric transition-all duration-500 hover-lift">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-3/4 mb-2" />
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-11/12" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
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
                      <AuthorDisplay profile={entry.profiles} />
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