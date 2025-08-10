import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Code2, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingCounter from "@/components/ui/floating-counter";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { LogEntry } from "@/lib/types";

type HomeLogEntry = {
  id: string
  title: string
  summary?: string
  day: number
  created_at: string
  profiles?: { username?: string }
}

const Home = () => {
  const [logs, setLogs] = useState<HomeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const maxDay = useMemo(() => (logs[0]?.day ? Number(logs[0].day) : 0), [logs]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data, error } = await supabase
          .from('logs')
          .select(`
            id,
            title,
            summary,
            day,
            created_at,
            profiles:profiles!logs_user_fk ( username )
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Failed to fetch logs:', error);
        } else {
          setLogs((data as HomeLogEntry[]) || []);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  return (
    <>
      <FloatingCounter />
      <div className="min-h-screen pt-20 relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-30" />
        
        {/* Hero Section */}
        <section className="px-6 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-float mb-8">
              <Badge variant="secondary" className="glow-electric px-6 py-3 text-base font-mono hover-lift">
                <Sparkles className="w-5 h-5 mr-3" />
                Day {maxDay} of 100
              </Badge>
            </div>
            
            <h1 className="mb-8 fade-in-up">
              <span className="gradient-text-electric block">#100DaysOfAI</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto fade-in-up leading-relaxed">
              A public learning sprint where I deepen my skills in <span className="text-electric font-semibold">AI-native tools</span>, 
              <span className="text-cyber font-semibold"> Python automation</span>, 
              and the art of building with artificial intelligence as a creative partner.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center fade-in-up">
              <Button asChild size="lg" className="glow-primary hover-lift text-lg px-8 py-4">
                <Link to="/log">
                  View Daily Log <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="hover-lift text-lg px-8 py-4">
                <Link to="/about">Learn About Me</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Recent Entries */}
        <section className="px-6 py-20 relative">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <Calendar className="w-8 h-8 text-electric" />
              <h2 className="gradient-text-cyber">Recent Entries</h2>
            </div>
            
            <div className="grid gap-8">
              {loading ? (
                <Card className="glow-primary hover:glow-electric transition-all duration-500 hover-lift">
                  <CardContent className="py-12 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="p-4 rounded-full bg-electric/10">
                        <Sparkles className="w-8 h-8 text-electric" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Loading Entries...</h3>
                        <p className="text-muted-foreground mb-6">
                          Please wait while we fetch the latest entries.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                             ) : logs.length > 0 ? (
                 logs.map((entry, index) => (
                  <Link 
                    key={entry.id} 
                    to={`/log/${entry.id}`}
                    className="block"
                  >
                     <Card 
                       className="glow-primary hover:glow-electric transition-all duration-500 group hover-lift cursor-pointer"
                       style={{ animationDelay: `${index * 0.1}s` }}
                     >
                       <CardHeader className="pb-6">
                         <div className="flex items-center justify-between mb-4">
                           <Badge variant="secondary" className="font-mono text-base px-4 py-2">
                             Day {entry.day}
                           </Badge>
                           <span className="text-sm text-muted-foreground font-mono">
                             {entry.created_at ? new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                           </span>
                         </div>
                          <CardTitle className="text-2xl md:text-3xl group-hover:gradient-text-electric transition-all duration-500 leading-tight">
                            {entry.title}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground">
                            By {entry?.profiles?.username || 'Unknown'}
                          </div>
                       </CardHeader>
                       <CardContent>
                         <CardDescription className="text-lg leading-relaxed">
                           {entry.summary}
                         </CardDescription>
                       </CardContent>
                     </Card>
                   </Link>
                 ))
              ) : (
                <Card className="glow-primary hover:glow-electric transition-all duration-500 hover-lift">
                  <CardContent className="py-12 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="p-4 rounded-full bg-electric/10">
                        <Sparkles className="w-8 h-8 text-electric" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Ready to Begin</h3>
                        <p className="text-muted-foreground mb-6">
                          Your first log entry will appear here once you start your #100DaysOfAI journey.
                        </p>
                        <Button asChild size="lg" className="glow-primary hover:glow-electric">
                          <Link to="/new-log">
                            Create Your First Entry <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild variant="outline" size="lg" className="hover-lift">
                <Link to="/log">
                  View All Entries <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* What I'm Building */}
        <section className="px-6 py-20 relative">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-12">
              <Code2 className="w-8 h-8 text-cyber" />
              <h2 className="gradient-text-electric">What I'm Building</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="glow-primary hover:glow-cyber transition-all duration-500 hover-lift group">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-cyber/10 group-hover:bg-cyber/20 transition-colors">
                      <Sparkles className="w-6 h-6 text-cyber" />
                    </div>
                    <CardTitle className="text-xl">AI-Native Tools</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    Exploring the next generation of software that puts AI at the center of the development process
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="glow-primary hover:glow-electric transition-all duration-500 hover-lift group">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-electric/10 group-hover:bg-electric/20 transition-colors">
                      <Zap className="w-6 h-6 text-electric" />
                    </div>
                    <CardTitle className="text-xl">Python Automation</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    Building intelligent workflows that bridge AI capabilities with real-world tasks and systems
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
            
            <div className="text-center mt-12">
              <Button asChild variant="outline" size="lg" className="hover-lift">
                <Link to="/projects">
                  Explore Projects <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;