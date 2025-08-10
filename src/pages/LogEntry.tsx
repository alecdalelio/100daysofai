import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Share2, ExternalLink, Trash2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FloatingCounter from "@/components/ui/floating-counter";
import { useAuth } from "@/auth/AuthProvider";
import { LogEntry as LogEntryType } from "@/lib/types";
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
          console.error('Missing logId from route param:', id);
          setError('Invalid log identifier');
          setLoading(false);
          return;
        }

        // Instrumented Supabase query per requested format
        console.log("Fetching log for ID:", logId);
        const { data, error } = await supabase
          .from('logs')
          .select('*')
          .eq('id', logId)
          .single();

        console.log("Supabase data:", data);
        console.log("Supabase error:", error);

        if (!data && !error) {
          console.warn("No data returned, no error — possibly row does not exist or fails RLS policy.");
        }

        if (error) {
          const errorObj = error as { code?: string }
          if (errorObj.code === 'PGRST116') {
            setError('Entry not found');
          } else {
            setError('Failed to fetch entry');
          }
        } else {
          setEntry(data as LogEntryType);
        }
      } catch (err) {
        console.error('Unexpected error while fetching entry by id:', err);
        setError('Failed to fetch entry');
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
            <div className="max-w-4xl mx-auto text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
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