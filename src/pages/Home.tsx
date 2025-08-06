import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Code2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="ambient-float mb-8">
            <Badge variant="secondary" className="glow-electric px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Day 3 of 100
            </Badge>
          </div>
          
          <h1 className="mb-6 fade-in-up">
            <span className="gradient-text-electric">#100DaysOfAI</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto fade-in-up">
            A public learning sprint where I deepen my skills in AI-native tools, Python automation, 
            and the art of building with artificial intelligence as a creative partner.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up">
            <Button asChild size="lg" className="glow-primary">
              <Link to="/log">
                View Daily Log <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/about">Learn About Me</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Recent Entries */}
      <section className="px-6 py-16 bg-gradient-to-br from-background to-accent/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Calendar className="w-6 h-6 text-electric" />
            <h2 className="gradient-text-cyber">Recent Entries</h2>
          </div>
          
          <div className="grid gap-6">
            {recentEntries.map((entry) => (
              <Card key={entry.day} className="glow-primary hover:glow-electric transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Day {entry.day}</Badge>
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                  </div>
                  <CardTitle className="group-hover:gradient-text-electric transition-all duration-300">
                    {entry.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {entry.preview}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link to="/log">
                View All Entries <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What I'm Building */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Code2 className="w-6 h-6 text-cyber" />
            <h2 className="gradient-text-electric">What I'm Building</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glow-primary">
              <CardHeader>
                <CardTitle>AI-Native Tools</CardTitle>
                <CardDescription>
                  Exploring the next generation of software that puts AI at the center
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="glow-primary">
              <CardHeader>
                <CardTitle>Python Automation</CardTitle>
                <CardDescription>
                  Building workflows that bridge AI capabilities with real-world tasks
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link to="/projects">
                Explore Projects <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;