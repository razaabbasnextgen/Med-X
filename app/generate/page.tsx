"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Cpu, Loader2, Sparkles, X, Share2, Plus } from "lucide-react"
import { BlogInput, GeneratedBlog, MediumPublishingOptions } from '@/types/blog';
import { CredentialManager } from '@/components/credential-manager';
import { Label } from "@/components/ui/label"

function ControlDeck({ 
  onGenerate, 
  isGenerating, 
  blogInput, 
  setBlogInput, 
  keywords, 
  setKeywords, 
  keywordInput, 
  setKeywordInput,
  credentials,
  setCredentials,
  hasCredentials,
  setHasCredentials 
}: any) {
  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k: string) => k !== keyword))
  }

  return (
    <Card className="h-full flex flex-col bg-card/50 border-0">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Agent Control Deck</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-mono text-accent">1. Core Directive</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <Input
                placeholder="e.g., Write an in-depth analysis of AI's impact on modern healthcare diagnostics"
                className="text-base"
                value={blogInput.topic}
                onChange={(e) => setBlogInput({...blogInput, topic: e.target.value})}
              />
              <Textarea
                placeholder="Describe your target audience (e.g., healthcare professionals, tech enthusiasts, general public)"
                className="min-h-[80px]"
                value={blogInput.targetAudience}
                onChange={(e) => setBlogInput({...blogInput, targetAudience: e.target.value})}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="font-mono">2. Parameters</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Keywords</label>
                <div className="flex gap-2 mt-1">
                  <Input 
                    placeholder="Add keyword" 
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                  />
                  <Button onClick={addKeyword} variant="outline" size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((keyword: string) => (
                    <Badge key={keyword} variant="secondary" className="group">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tone</label>
                <Select value={blogInput.tone} onValueChange={(value) => setBlogInput({...blogInput, tone: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="informative">Informative</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="font-mono">3. Credentials</AccordionTrigger>
            <AccordionContent className="pt-4">
              <CredentialManager 
                onCredentialsReady={(creds) => {
                  setCredentials(creds);
                  setHasCredentials(true);
                }}
                onCredentialsChanged={(hasValid) => {
                  setHasCredentials(hasValid);
                }}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="font-mono">4. Launch</AccordionTrigger>
            <AccordionContent className="pt-4">
              <Button 
                size="lg" 
                className="w-full bg-accent text-black font-bold hover:bg-accent/90 accent-glow"
                onClick={onGenerate}
                disabled={isGenerating || !blogInput.topic || !blogInput.targetAudience}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Deploying Agent
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" /> Deploy Agent
                  </>
                )}
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

function LiveCanvas({ 
  generatedBlog, 
  isGenerating, 
  generationProgress, 
  agentLog, 
  error,
  onPublish,
  isPublishing,
  publishingResult 
}: any) {
  if (error) {
    return (
      <div className="h-full flex flex-col gap-4">
        <Card className="flex-1 bg-transparent border-dashed">
          <CardContent className="p-6 h-full flex items-center justify-center">
            <Alert className="max-w-md">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="h-full flex flex-col gap-4">
        <Card className="flex-1 bg-transparent border-dashed">
          <CardContent className="p-6 h-full flex items-center justify-center">
            <div className="text-center">
              <Progress value={generationProgress} className="w-48 mb-4" />
              <p className="text-lg font-medium">Agent is working...</p>
              <p className="text-sm text-muted-foreground">{generationProgress}% complete</p>
            </div>
          </CardContent>
        </Card>
        <Card className="h-64 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="font-mono text-lg">Agent Log</CardTitle>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
              <span className="text-sm text-green-400">Active</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-3 font-mono text-sm">
                {agentLog.map((entry: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    {entry.status === "complete" && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                    {entry.status === "active" && <Loader2 className="h-4 w-4 text-accent animate-spin" />}
                    {entry.status === "pending" && <div className="h-4 w-4" />}
                    <span className={entry.status === "pending" ? "text-muted-foreground/50" : ""}>{entry.text}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (generatedBlog) {
    return (
      <div className="h-full flex flex-col gap-4">
        <Card className="flex-1 bg-transparent border-dashed">
          <CardContent className="p-6 h-full overflow-y-auto">
            <div className="prose prose-invert max-w-none">
              <h2 className="font-heading text-3xl">{generatedBlog.ontology.title}</h2>
              <div className="text-sm text-muted-foreground mb-4">
                Estimated read time: {generatedBlog.ontology.estimatedReadTime} minutes
              </div>
              <div dangerouslySetInnerHTML={{ __html: generatedBlog.content }} />
            </div>
          </CardContent>
        </Card>
        <Card className="h-64 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="font-mono text-lg">Publishing Options</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={onPublish}
                disabled={isPublishing}
                className="bg-black text-white hover:bg-gray-800"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" /> Publish to Medium
                  </>
                )}
              </Button>
            </div>
            {publishingResult && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Successfully published to Medium!</p>
                    {publishingResult.mediumUrl && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Article URL:</p>
                        <a 
                          href={publishingResult.mediumUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                        >
                          {publishingResult.mediumUrl}
                        </a>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(publishingResult.mediumUrl, '_blank')}
                          >
                            📖 View Article
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(publishingResult.mediumUrl)}
                          >
                            📋 Copy Link
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <div className="text-xs text-muted-foreground">
              <p>SEO Score: {generatedBlog.generation_metadata?.content_quality_score}/100</p>
              <p>Research Sources: {generatedBlog.generation_metadata?.research_sources_count}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <Card className="flex-1 bg-transparent border-dashed">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <Cpu className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-heading text-3xl mb-2">Agent Ready</h2>
            <p className="text-muted-foreground">
              Configure your parameters and deploy the agent to begin content generation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface Credentials {
  email: string;
  emailPassword: string;
  mediumUsername: string;
  googleApiKey: string;
}

export default function GeneratePage() {
  const [blogInput, setBlogInput] = useState<BlogInput>({
    topic: '',
    tone: 'informative',
    targetAudience: '',
    keywords: []
  });

  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishingResult, setPublishingResult] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);

  const [agentLog, setAgentLog] = useState([
    { text: "Agent Initialized. Awaiting directive...", status: "complete" },
  ]);

  const updateAgentLog = (message: string, status: string = "active") => {
    setAgentLog(prev => [...prev, { text: message, status }]);
  };

  const generateBlog = async () => {
    if (!blogInput.topic || !blogInput.targetAudience) {
      setError('Please fill in the required fields: topic and target audience');
      return;
    }

    if (!credentials?.googleApiKey) {
      setError('Google API key is required for blog generation. Please configure your credentials.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setAgentLog([
      { text: "Agent Initialized. Awaiting directive...", status: "complete" },
      { text: "Directive received. Parsing parameters...", status: "complete" },
      { text: "Conducting research...", status: "active" },
    ]);

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 1000);

    try {
      updateAgentLog("Researching topic and gathering data...", "active");
      
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: blogInput.topic,
          tone: blogInput.tone,
          targetAudience: blogInput.targetAudience,
          keywords: keywords || [],
          credentials: { 
            googleApiKey: credentials.googleApiKey 
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid response format');
      }

      updateAgentLog("Content generation complete!", "complete");
      setGeneratedBlog(result.data);
      setGenerationProgress(100);
    } catch (err) {
      console.error('Blog generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while generating the blog';
      setError(errorMessage);
      updateAgentLog("Generation failed. Check parameters.", "complete");
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const publishToMedium = async () => {
    if (!generatedBlog) {
      setError('No blog content to publish');
      return;
    }

    if (!credentials?.email || !credentials?.emailPassword || !credentials?.mediumUsername) {
      setError('Medium publishing requires email, password, and Medium username. Please configure your credentials.');
      return;
    }

    setIsPublishing(true);
    setError(null);

    const mediumCredentials = {
      email: credentials.email,
      emailPassword: credentials.emailPassword,
      mediumUsername: credentials.mediumUsername
    };

    const publishingOptions: MediumPublishingOptions = {
      tags: generatedBlog.ontology.hashtags.map(tag => tag.replace('#', '')),
      publishStatus: 'public',
      notifyFollowers: true,
      license: 'all-rights-reserved'
    };

    try {
      const response = await fetch('/api/publish-medium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blog: generatedBlog,
          publishingOptions,
          credentials: mediumCredentials
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Publishing failed');
      }

      setPublishingResult(result.data);
    } catch (err) {
      console.error('Medium publishing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while publishing to Medium';
      setError(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 h-screen">
      <div className="lg:col-span-3 border-r p-2">
        <ControlDeck 
          onGenerate={generateBlog}
          isGenerating={isGenerating}
          blogInput={blogInput}
          setBlogInput={setBlogInput}
          keywords={keywords}
          setKeywords={setKeywords}
          keywordInput={keywordInput}
          setKeywordInput={setKeywordInput}
          credentials={credentials}
          setCredentials={setCredentials}
          hasCredentials={hasCredentials}
          setHasCredentials={setHasCredentials}
        />
      </div>
      <div className="lg:col-span-7 p-4">
        <LiveCanvas 
          generatedBlog={generatedBlog}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          agentLog={agentLog}
          error={error}
          onPublish={publishToMedium}
          isPublishing={isPublishing}
          publishingResult={publishingResult}
        />
      </div>
    </div>
  )
} 