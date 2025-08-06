import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Code2, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingCounter from "@/components/ui/floating-counter";

const Home = () => {
  const recentEntries = [
    {
      day: 3,
      title: "Building AI-native workflows with Claude + Cursor",
      date: "Jan 8, 2025",
      preview: "Explored how AI pair programming changes the game for rapid prototyping..."
    },
    {
      day: 2,
      title: "LLM agent architectures: ReAct vs Function Calling",
      date: "Jan 7, 2025",
      preview: "Diving deep into different patterns for building reliable AI agents..."
    },
    {
      day: 1,
      title: "Kicking off #100DaysOfAI",
      date: "Jan 6, 2025",
      preview: "Setting intentions, choosing tools, and mapping the learning journey ahead..."
    }
  ];

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
                Day 3 of 100
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
              {recentEntries.map((entry, index) => (
                <Card 
                  key={entry.day} 
                  className="glow-primary hover:glow-electric transition-all duration-500 group hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary" className="font-mono text-base px-4 py-2">
                        Day {entry.day}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-mono">{entry.date}</span>
                    </div>
                    <CardTitle className="text-2xl md:text-3xl group-hover:gradient-text-electric transition-all duration-500 leading-tight">
                      {entry.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-lg leading-relaxed">
                      {entry.preview}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
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