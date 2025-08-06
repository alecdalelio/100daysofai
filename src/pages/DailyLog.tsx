import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Share2, ExternalLink } from "lucide-react";
import { useState } from "react";
import FloatingCounter from "@/components/ui/floating-counter";

const DailyLog = () => {
  const [entries] = useState([
    {
      day: 3,
      date: "January 8, 2025",
      title: "Building AI-native workflows with Claude + Cursor",
      content: `
Today I dove deep into the synergy between Claude and Cursor for AI-assisted development. 

**Key Learnings:**
- Cursor's AI pair programming feels like having a senior dev looking over your shoulder
- Claude Code excels at architectural decisions and complex refactoring
- The combination creates a flow state I've never experienced in traditional coding

**What I Built:**
- A React component generator that writes both the component and its tests
- Integration pipeline that connects Notion → AI processing → automated deployments

**Tomorrow's Focus:**
Exploring RAG architectures and how to build context-aware AI agents.
      `,
      tags: ["Claude", "Cursor", "React", "Automation"],
      timeSpent: "4 hours",
      tools: ["Claude", "Cursor", "React", "TypeScript"]
    },
    {
      day: 2,
      date: "January 7, 2025", 
      title: "LLM agent architectures: ReAct vs Function Calling",
      content: `
Spent the day understanding different patterns for building reliable AI agents.

**ReAct Pattern:**
- Reason → Act → Observe cycle
- More transparent but potentially slower
- Great for complex multi-step reasoning

**Function Calling:**
- Direct tool invocation from LLM
- Faster execution, cleaner outputs
- Better for well-defined tool ecosystems

**Built a Prototype:**
A simple agent that can research topics and generate reports. Used OpenAI's function calling for tool interactions.

**Insight:** The key isn't choosing one pattern, but knowing when each shines.
      `,
      tags: ["LLM", "Agents", "ReAct", "Function Calling"],
      timeSpent: "3.5 hours",
      tools: ["OpenAI", "Python", "LangChain"]
    },
    {
      day: 1,
      date: "January 6, 2025",
      title: "Kicking off #100DaysOfAI",
      content: `
Setting intentions for this learning sprint.

**Why 100 Days?**
The AI landscape moves incredibly fast. I want to build deep, hands-on experience rather than just following along from the sidelines.

**My Learning Framework:**
1. **Build daily** - No passive consumption
2. **Document everything** - This site is my public learning notebook  
3. **Share insights** - Teaching forces clarity
4. **Stay curious** - Follow interesting tangents

**Tools I'm Focusing On:**
- Claude & ChatGPT for AI pair programming
- Python for automation and data work
- Various AI-native tools as they emerge

**First Project:** This very website, built with AI assistance.

The meta-recursion of using AI to build a site about learning AI feels perfectly 2025.
      `,
      tags: ["Meta", "Learning", "Intentions"],
      timeSpent: "2 hours",
      tools: ["Claude", "React", "Vercel"]
    }
  ]);

  const handleShare = (entry: any) => {
    const url = `${window.location.origin}/log/day-${entry.day}`;
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

            {/* Entries */}
            <div className="space-y-12">
              {entries.map((entry, index) => (
                <Card 
                  key={entry.day} 
                  className="glow-primary hover:glow-electric transition-all duration-500 group hover-lift"
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
                          {entry.date}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(entry)}
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
                      </div>
                    </div>
                    
                    <CardTitle className="text-2xl md:text-3xl group-hover:gradient-text-cyber transition-all duration-500 leading-tight">
                      {entry.title}
                    </CardTitle>
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
                            <p key={idx} className="text-foreground leading-relaxed">
                              {paragraph}
                            </p>
                          );
                        }
                        return <br key={idx} />;
                      })}
                    </div>
                    
                    {/* Meta info */}
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Time:</span>
                        <Badge variant="outline">{entry.timeSpent}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Tools:</span>
                        <div className="flex gap-1">
                          {entry.tools.map((tool) => (
                            <Badge key={tool} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="hover:glow-electric transition-all cursor-pointer">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Progress indicator */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-4 p-6 rounded-xl bg-accent/20 border border-border hover-lift glow-primary">
                <span className="text-sm text-muted-foreground font-medium">Progress</span>
                <div className="w-48 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-electric to-cyber transition-all duration-500 animate-shimmer"
                    style={{ width: `${(3 / 100) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-bold">3/100 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DailyLog;