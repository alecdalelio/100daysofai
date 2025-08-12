import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowLeft, Share2, ExternalLink, Trash2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FloatingCounter from "@/components/ui/floating-counter";
import { AuthorDisplay } from "@/components/AuthorDisplay";
import { useAuth } from "@/auth/AuthProvider";
import { LogEntry as LogEntryType } from "@/lib/types";
import { fetchSingleLogWithProfile } from "@/lib/fetchLogsWithProfiles";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const LogEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [entry, setEntry] = useState<LogEntryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchEntry() {
      try {
        // Treat id as string (supports UUIDs)
        const logId = (id ?? '').toString();
        if (!logId) {
          console.error('[LogEntry] Missing logId from route param:', id);
          setError('Invalid log identifier');
          setLoading(false);
          return;
        }

        console.log(`[LogEntry] Starting to fetch entry for ID: ${logId}`);
        
        const entry = await fetchSingleLogWithProfile(logId);

        if (!entry) {
          console.warn("[LogEntry] No entry found for ID:", logId);
          setError('Entry not found');
        } else {
          console.log('[LogEntry] Successfully loaded entry:', entry.title);
          setEntry(entry);
        }
      } catch (err) {
        console.error('[LogEntry] Unexpected error while fetching entry:', err);
        const errorObj = err as { code?: string };
        if (errorObj.code === 'PGRST116') {
          setError('Entry not found');
        } else {
          setError('Failed to fetch entry');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchEntry();
  }, [id]);

  const isOwner = entry?.user_id && userId && entry.user_id === userId;

  async function handleDeleteConfirmed() {
    if (!id) return;
    try {
      setDeleting(true);
      const { error } = await supabase.from('logs').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete log:', error);
        return;
      }
      navigate('/log');
    } finally {
      setDeleting(false);
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/log/${id}`;
    navigator.clipboard.writeText(url);
    // You could show a toast here
  };

  if (loading) {
    return (
      <>
        <FloatingCounter />
        <div className="min-h-screen pt-20 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="px-6 py-16 relative">
            <div className="max-w-4xl mx-auto">
              {/* Navigation skeleton */}
              <div className="mb-8">
                <Skeleton className="h-8 w-32" />
              </div>

              {/* Entry skeleton */}
              <Card className="glow-primary hover:glow-electric transition-all duration-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-64 rounded-xl mt-4" />
                  <Skeleton className="h-4 w-40 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !entry) {
    return (
      <>
        <FloatingCounter />
        <div className="min-h-screen pt-20 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="px-6 py-16 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="mb-6">
                <span className="gradient-text-electric">Entry Not Found</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {error || 'The requested entry could not be found.'}
              </p>
              <Button asChild>
                <Link to="/log">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Entries
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FloatingCounter />
      <div className="min-h-screen pt-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        
        <div className="px-6 py-16 relative">
          <div className="max-w-4xl mx-auto">
            {/* Navigation */}
            <div className="mb-8">
              <Button asChild variant="ghost" className="hover-lift">
                <Link to="/log">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Entries
                </Link>
              </Button>
            </div>

            {/* Entry */}
            <Card className="glow-primary hover:glow-electric transition-all duration-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
                      Day {entry.day}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                      <Calendar className="w-4 h-4" />
                      {entry.created_at ? new Date(entry.created_at).toLocaleDateString(undefined, { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : ''}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="h-8 w-8 p-0 hover-lift"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover-lift"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    {isOwner && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 px-2 hover-lift"
                            disabled={deleting}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this log?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the log entry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirmed} disabled={deleting}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                
                <CardTitle className="text-3xl md:text-4xl gradient-text-electric leading-tight">
                  {entry.title}
                </CardTitle>
                
                <AuthorDisplay profile={entry.profiles} showAvatar={true} avatarSize="md" />
                
                {entry.summary && (
                  <CardDescription className="text-lg leading-relaxed">
                    {entry.summary}
                  </CardDescription>
                )}
              </CardHeader>
            
              <CardContent className="space-y-6">
                <div className="prose prose-invert max-w-none">
                  {entry.content.split('\n').map((paragraph, idx) => {
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
                        <p key={idx} className="leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      );
                    }
                    return <br key={idx} />;
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogEntry; 