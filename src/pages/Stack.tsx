import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Code2, Zap, Database, Globe, Wrench } from "lucide-react";

const Stack = () => {
  const categories = [
    {
      title: "AI & LLM Tools",
      icon: Sparkles,
      color: "electric",
      tools: [
        { name: "Claude (Anthropic)", proficiency: 85, description: "Primary AI pair programming partner", status: "Daily Use" },
        { name: "ChatGPT (OpenAI)", proficiency: 80, description: "Code review and architectural decisions", status: "Daily Use" },
        { name: "Cursor", proficiency: 75, description: "AI-native code editor", status: "Learning" },
        { name: "GitHub Copilot", proficiency: 70, description: "Autocomplete and suggestions", status: "Exploring" },
        { name: "LangChain", proficiency: 60, description: "Building LLM applications", status: "Learning" }
      ]
    },
    {
      title: "Development",
      icon: Code2,
      color: "cyber", 
      tools: [
        { name: "Python", proficiency: 85, description: "Automation, AI, data processing", status: "Expert" },
        { name: "TypeScript", proficiency: 80, description: "Frontend development", status: "Daily Use" },
        { name: "React", proficiency: 85, description: "UI development", status: "Expert" },
        { name: "Next.js", proficiency: 70, description: "Full-stack React apps", status: "Proficient" },
        { name: "Tailwind CSS", proficiency: 90, description: "Styling and design systems", status: "Expert" }
      ]
    },
    {
      title: "Automation & APIs",
      icon: Zap,
      color: "neural",
      tools: [
        { name: "Zapier", proficiency: 75, description: "Workflow automation", status: "Daily Use" },
        { name: "Make (Integromat)", proficiency: 65, description: "Complex automation", status: "Learning" },
        { name: "Notion API", proficiency: 70, description: "Knowledge management", status: "Exploring" },
        { name: "Airtable API", proficiency: 60, description: "Database automation", status: "Learning" },
        { name: "FastAPI", proficiency: 75, description: "Python web APIs", status: "Proficient" }
      ]
    },
    {
      title: "Data & Infrastructure", 
      icon: Database,
      color: "electric",
      tools: [
        { name: "PostgreSQL", proficiency: 70, description: "Primary database", status: "Proficient" },
        { name: "Supabase", proficiency: 65, description: "Backend as a service", status: "Learning" },
        { name: "Vercel", proficiency: 80, description: "Deployment and hosting", status: "Daily Use" },
        { name: "Docker", proficiency: 60, description: "Containerization", status: "Learning" },
        { name: "AWS", proficiency: 55, description: "Cloud infrastructure", status: "Exploring" }
      ]
    },
    {
      title: "Productivity",
      icon: Wrench,
      color: "cyber",
      tools: [
        { name: "Notion", proficiency: 85, description: "Knowledge management", status: "Daily Use" },
        { name: "Linear", proficiency: 75, description: "Project management", status: "Daily Use" },
        { name: "Figma", proficiency: 70, description: "Design and prototyping", status: "Proficient" },
        { name: "Obsidian", proficiency: 60, description: "Personal knowledge graph", status: "Exploring" },
        { name: "Raycast", proficiency: 80, description: "Productivity launcher", status: "Daily Use" }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Expert": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Daily Use": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Proficient": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Learning": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Exploring": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case "electric": return "text-electric";
      case "cyber": return "text-cyber";
      case "neural": return "text-neural";
      default: return "text-primary";
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="mb-4">
              <span className="gradient-text-electric">Stack</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The tools, technologies, and platforms I'm mastering during #100DaysOfAI. 
              From AI-native development to automation and beyond.
            </p>
          </div>

          {/* Stack Categories */}
          <div className="space-y-12">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.title}>
                  <div className="flex items-center gap-3 mb-6">
                    <IconComponent className={`w-6 h-6 ${getColorClass(category.color)}`} />
                    <h2 className="text-2xl font-bold gradient-text-cyber">
                      {category.title}
                    </h2>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.tools.map((tool) => (
                      <Card key={tool.name} className="glow-primary hover:glow-electric transition-all duration-300 group">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg group-hover:gradient-text-electric transition-all duration-300">
                                {tool.name}
                              </CardTitle>
                              <Badge className={`text-xs mt-2 ${getStatusColor(tool.status)}`}>
                                {tool.status}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-electric">
                                {tool.proficiency}%
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <CardDescription className="text-sm leading-relaxed">
                            {tool.description}
                          </CardDescription>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Proficiency</span>
                              <span>{tool.proficiency}%</span>
                            </div>
                            <Progress 
                              value={tool.proficiency} 
                              className="h-2"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Learning Philosophy */}
          <div className="mt-16">
            <Card className="glow-primary bg-gradient-to-br from-background to-accent/5">
              <CardContent className="py-12 text-center">
                <Globe className="w-12 h-12 mx-auto mb-4 text-electric ambient-float" />
                <h3 className="text-2xl font-bold mb-4 gradient-text-electric">Always Learning</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  The AI landscape evolves daily. I focus on tools that enhance human creativity 
                  and productivity, always staying curious about what's next. This stack represents 
                  my current toolkit, but it's constantly evolving.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stack;