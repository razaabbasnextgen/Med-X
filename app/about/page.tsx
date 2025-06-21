import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Bot, Github, Linkedin, Mail, Code, Brain, Zap } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const developers = [
    {
      name: "Alex Chen",
      role: "Lead AI Engineer",
      bio: "Specializes in advanced AI systems and content generation algorithms. 5+ years in machine learning and natural language processing.",
      skills: ["AI/ML", "Python", "TensorFlow", "NLP"],
      github: "alexchen",
      linkedin: "alexchen-ai",
      email: "alex@med-x.ai"
    },
    {
      name: "Sarah Rodriguez", 
      role: "Full-Stack Developer",
      bio: "Expert in building scalable web applications and user interfaces. Passionate about creating seamless user experiences.",
      skills: ["React", "Next.js", "TypeScript", "Node.js"],
      github: "sarahrodriguez",
      linkedin: "sarah-rodriguez-dev",
      email: "sarah@med-x.ai"
    },
    {
      name: "Marcus Johnson",
      role: "DevOps & Automation Engineer", 
      bio: "Focuses on automation, deployment pipelines, and system architecture. Ensures reliable and scalable infrastructure.",
      skills: ["Docker", "AWS", "CI/CD", "Automation"],
      github: "marcusjohnson",
      linkedin: "marcus-johnson-devops",
      email: "marcus@med-x.ai"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="container z-10 flex items-center justify-between py-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold">
            Med<span className="text-accent font-black text-2xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">X</span>
          </span>
        </Link>
        <Button asChild variant="ghost">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </header>

      <main className="container py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
            <span className="text-sm font-medium">About Med<span className="text-accent font-black">X</span></span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            The Future of AI-Powered Content Creation
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Med<span className="text-accent font-black">X</span> is an advanced AI agent platform that autonomously researches, writes, and publishes 
            high-quality content with strategic precision and expert-level insights.
          </p>
        </div>

        {/* What We Do */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Research</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI agent conducts comprehensive research across multiple sources, 
                  gathering the latest insights and data to inform content creation.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Expert Writing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  With 30+ years of simulated writing experience, our system creates 
                  viral-worthy content using psychological hooks and engagement strategies.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Automated Publishing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Seamlessly publishes to Medium and other platforms with optimized 
                  formatting, SEO, and engagement elements.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Development Team */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Meet Our Development Team</h2>
            <p className="text-muted-foreground">
              The brilliant minds behind Med<span className="text-accent font-black">X</span>'s cutting-edge technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {developers.map((dev, index) => (
              <Card key={index} className="relative group hover:shadow-lg transition-shadow">
                <CardHeader className="text-center space-y-2">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent to-primary rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold">
                    {dev.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <CardTitle className="text-xl">{dev.name}</CardTitle>
                  <Badge variant="secondary" className="mx-auto">
                    {dev.role}
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {dev.bio}
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {dev.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-3 pt-2">
                    <Button size="sm" variant="ghost" className="p-2">
                      <Github className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="p-2">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="p-2">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technology Stack */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Technology Stack</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-2">
                  <h4 className="font-semibold">Frontend</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Next.js 15</p>
                    <p>React 19</p>
                    <p>TypeScript</p>
                    <p>Tailwind CSS</p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="font-semibold">AI & ML</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Google Gemini</p>
                    <p>GPT Integration</p>
                    <p>NLP Processing</p>
                    <p>Research APIs</p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="font-semibold">Automation</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Puppeteer</p>
                    <p>Medium API</p>
                    <p>Gmail Integration</p>
                    <p>SEO Optimization</p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="font-semibold">Infrastructure</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Node.js</p>
                    <p>API Routes</p>
                    <p>File System</p>
                    <p>Security</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <section className="text-center space-y-6 py-8">
          <h2 className="text-3xl font-bold">Ready to Transform Your Content Creation?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the power of AI-driven content creation with Med<span className="text-accent font-black">X</span>. 
            Let our advanced agent handle the research, writing, and publishing while you focus on strategy.
          </p>
          <Button asChild size="lg" className="bg-accent text-black font-bold hover:bg-accent/90">
            <Link href="/generate">
              Start Creating Content <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  )
}
