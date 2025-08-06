import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Sparkles, Code2, Zap } from "lucide-react";

const Projects = () => {
  const projects = [
    {
      title: "AI Research Agent",
      description: "Multi-modal agent that researches topics, synthesizes information, and generates comprehensive reports with citations.",
      status: "In Progress",
      tech: ["Python", "OpenAI", "LangChain", "Streamlit"],
      insights: [
        "ReAct pattern works well for complex research tasks",
        "Citation tracking requires careful prompt engineering",
        "Memory management becomes critical for long research sessions"
      ],
      github: "https://github.com/alecdalelio/ai-research-agent",
      demo: null,
      startDay: 2,
      icon: Sparkles
    },
    {
      title: "Code Review AI",
      description: "AI-powered code reviewer that understands context, suggests improvements, and maintains coding standards across teams.",
      status: "Planning", 
      tech: ["TypeScript", "Claude", "GitHub API", "React"],
      insights: [
        "Need to balance automation with human judgment",
        "Context window optimization is crucial for large PRs",
        "Integration with existing workflows is key to adoption"
      ],
      github: null,
      demo: null,
      startDay: 5,
      icon: Code2
    },
    {
      title: "Personal AI Workflow Engine",
      description: "Orchestrates AI tools to automate my daily tasks: email processing, content creation, research, and project management.",
      status: "Concept",
      tech: ["Python", "Zapier", "Notion API", "Claude"],
      insights: [
        "Personal automation needs are surprisingly complex",
        "Chain-of-thought prompting improves task completion",
        "Error handling and retries are essential for reliability"
      ],
      github: null,
      demo: null,
      startDay: 10,
      icon: Zap
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-cyber/20 text-cyber border-cyber/30";
      case "Planning": return "bg-electric/20 text-electric border-electric/30";
      case "Concept": return "bg-neural/20 text-neural border-neural/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="mb-4">
              <span className="gradient-text-electric">Projects</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-native tools and experiments I'm building during #100DaysOfAI. 
              Each project pushes the boundaries of what's possible with modern AI.
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {projects.map((project) => {
              const IconComponent = project.icon;
              return (
                <Card key={project.title} className="glow-primary hover:glow-electric transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/20">
                          <IconComponent className="w-5 h-5 text-electric" />
                        </div>
                        <div>
                          <CardTitle className="group-hover:gradient-text-cyber transition-all duration-300">
                            {project.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                              {project.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Day {project.startDay}+
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <CardDescription className="text-base leading-relaxed">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Tech Stack */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-electric">Tech Stack</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.tech.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Key Insights */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-cyber">Key Insights</h4>
                      <ul className="space-y-2">
                        {project.insights.map((insight, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-electric mt-1">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      {project.github && (
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a href={project.github} target="_blank" rel="noopener noreferrer">
                            <Github className="w-4 h-4 mr-2" />
                            Code
                          </a>
                        </Button>
                      )}
                      {project.demo && (
                        <Button size="sm" className="flex-1" asChild>
                          <a href={project.demo} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Demo
                          </a>
                        </Button>
                      )}
                      {!project.github && !project.demo && (
                        <Button variant="outline" size="sm" disabled className="flex-1">
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Future Projects Teaser */}
          <div className="mt-16 text-center">
            <Card className="glow-primary bg-gradient-to-br from-background to-accent/5">
              <CardContent className="py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-electric ambient-float" />
                <h3 className="text-2xl font-bold mb-4 gradient-text-electric">More Projects Coming</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  I'm just getting started. Follow along as I build increasingly sophisticated 
                  AI-native tools and share everything I learn.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;