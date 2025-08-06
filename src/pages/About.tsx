import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Briefcase, GraduationCap, Mail, Linkedin, Github, ExternalLink } from "lucide-react";

const About = () => {
  const experience = [
    {
      company: "Attention",
      role: "Founding Forward Deployed Engineer",
      period: "Feb 2025 - Present",
      description: "Building LLM-powered workflows and AI-native software to transform customer needs into production-ready tools.",
      achievements: [
        "Built 200+ LLM-powered workflows analyzing 50k+ sales calls/month",
        "Delivered insights via Slack, Teams, and email using scorecard agents",
        "Partnered cross-functionally to iterate fast and scale adoption"
      ]
    },
    {
      company: "Art Blocks",
      role: "Founding Technical Account Manager", 
      period: "Aug 2023 - Feb 2025",
      description: "Managed artist partnerships and technical integrations for generative art on blockchain.",
      achievements: [
        "QA'd 200+ generative art scripts with Art Blocks standards",
        "Managed 50+ artist and brand partnerships driving $20M+ in sales",
        "Streamlined internal processes and improved partner onboarding speed"
      ]
    },
    {
      company: "Reveel", 
      role: "Developer Relations & GTM",
      period: "Jan 2023 - Aug 2023",
      description: "Led growth initiatives for on-chain revenue share protocol.",
      achievements: [
        "Increased protocol revenue from low five figures to $500k+",
        "Launched AI voice-gen pilot with 10 musicians",
        "Drove 5x developer growth through strategic partnerships"
      ]
    }
  ];

  const education = [
    {
      school: "Northwestern University",
      degree: "BSc Learning & Organizational Change",
      minor: "Minor in Entrepreneurship",
      period: "2018-2022",
      details: "School of Education & Social Policy, Farley Center for Entrepreneurship"
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      <div className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="mb-4">
              <span className="gradient-text-electric">About</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From Venture for America to AI—my journey building at the intersection 
              of technology, creativity, and human potential.
            </p>
          </div>

          {/* Intro */}
          <Card className="glow-primary mb-12">
            <CardContent className="py-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-foreground">
                  I'm Alec D'Alelio, a forward-deployed engineer and technical operator focused on 
                  <span className="gradient-text-electric font-medium"> LLM agents and AI-native software</span>. 
                  I help teams turn customer needs into production-ready tools that integrate with CRMs, 
                  cloud APIs, and internal systems.
                </p>
                <p className="text-base text-muted-foreground mt-4">
                  My background spans full-stack engineering, developer education, and customer success. 
                  I've built everything from generative art platforms to on-chain revenue protocols, 
                  always focusing on the intersection of cutting-edge technology and real human needs.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="glow-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-electric" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">New York, NY</p>
              </CardContent>
            </Card>

            <Card className="glow-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-cyber" />
                  Get in Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="mailto:alecdalelio@gmail.com">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </a>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href="https://linkedin.com/in/alecdalelio" target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href="https://github.com/alecdalelio" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experience */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-electric" />
              <span className="gradient-text-cyber">Experience</span>
            </h2>
            
            <div className="space-y-6">
              {experience.map((job) => (
                <Card key={`${job.company}-${job.role}`} className="glow-primary">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-xl">{job.role}</CardTitle>
                        <CardDescription className="text-lg font-medium text-electric">
                          {job.company}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="self-start sm:self-center">
                        {job.period}
                      </Badge>
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      {job.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-2">
                      {job.achievements.map((achievement, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-cyber mt-1">•</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-cyber" />
              <span className="gradient-text-electric">Education</span>
            </h2>
            
            {education.map((edu) => (
              <Card key={edu.school} className="glow-primary">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl">{edu.degree}</CardTitle>
                      <CardDescription className="text-lg font-medium text-electric">
                        {edu.school}
                      </CardDescription>
                      {edu.minor && (
                        <CardDescription className="text-sm text-muted-foreground">
                          {edu.minor}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="outline">
                      {edu.period}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {edu.details}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Why #100DaysOfAI */}
          <Card className="glow-primary bg-gradient-to-br from-background to-accent/5">
            <CardHeader>
              <CardTitle className="text-2xl gradient-text-electric">
                Why #100DaysOfAI?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                The AI landscape moves incredibly fast. Rather than just following along from the sidelines, 
                I want to build deep, hands-on experience with the tools that are reshaping how we work and create.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This challenge is my way of staying at the frontier—learning in public, 
                sharing insights, and building things that push the boundaries of what's possible 
                when humans and AI work together.
              </p>
              <div className="pt-4">
                <Button asChild>
                  <a href="/log">
                    Follow My Journey <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;