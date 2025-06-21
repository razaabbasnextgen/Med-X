"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, Search, FileText, Send, CheckCircle, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { BlogInput, GeneratedBlog, MediumPublishingOptions } from '@/types/blog';
import { CredentialManager } from '@/components/credential-manager';

export default function BlogGenerator() {
  const [blogInput, setBlogInput] = useState<BlogInput>({
    topic: '',
    tone: 'informative',
    targetAudience: '',
    keywords: []
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishingResult, setPublishingResult] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [credentials, setCredentials] = useState<{ email: string; emailPassword: string; mediumUsername: string; googleApiKey: string } | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);

  // Debug: Log credential state changes
  React.useEffect(() => {
    console.log('🔍 BlogGenerator credentials state changed:', {
      hasCredentials,
      credentials: credentials ? {
        email: credentials.email,
        mediumUsername: credentials.mediumUsername,
        hasPassword: !!credentials.emailPassword
      } : null
    });
  }, [credentials, hasCredentials]);

  const addKeyword = () => {
    if (keywordInput.trim() && !blogInput.keywords?.includes(keywordInput.trim())) {
      setBlogInput(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setBlogInput(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || []
    }));
  };

  const generateBlog = async () => {
    if (!blogInput.topic || !blogInput.targetAudience) {
      setError('Please fill in the required fields: topic and target audience');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    // Debug: Log what credentials we're sending for blog generation
    console.log('🔍 Generating blog with credentials:', {
      hasCredentials: !!credentials,
      email: credentials?.email,
      hasGoogleApiKey: !!credentials?.googleApiKey
    });

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 1000);

    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...blogInput,
          credentials: credentials ? { googleApiKey: credentials.googleApiKey } : undefined
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate blog');
      }

      setGeneratedBlog(result.data);
      setGenerationProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the blog');
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const publishToMedium = async () => {
    if (!generatedBlog) return;

    setIsPublishing(true);
    setError(null);

    // Debug: Log what credentials we're sending
    console.log('🔍 Publishing to Medium with credentials:', {
      hasCredentials: !!credentials,
      credentialsObject: credentials,
      email: credentials?.email,
      mediumUsername: credentials?.mediumUsername,
      hasPassword: !!credentials?.emailPassword,
      hasGoogleApiKey: !!credentials?.googleApiKey
    });

    // Always send credentials if we have them, let the API handle validation
    const mediumCredentials = credentials ? {
      email: credentials.email || '',
      emailPassword: credentials.emailPassword || '',
      mediumUsername: credentials.mediumUsername || ''
    } : undefined;

    console.log('🔍 Medium credentials being sent to API:', {
      hasCredentials: !!mediumCredentials,
      email: mediumCredentials?.email,
      mediumUsername: mediumCredentials?.mediumUsername,
      hasPassword: !!mediumCredentials?.emailPassword
    });

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish to Medium');
      }

      setPublishingResult(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while publishing to Medium');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Med-X AI Blog Generator
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create high-quality, research-backed blog posts automatically. Input your topic and let AI handle the research, writing, and publishing.
        </p>
      </div>

      {/* Credential Manager */}
      <div className="mb-6">
        <CredentialManager 
          onCredentialsReady={(creds) => {
            console.log('🎯 BlogGenerator: Received credentials from CredentialManager:', {
              email: creds.email,
              mediumUsername: creds.mediumUsername,
              hasPassword: !!creds.emailPassword,
              hasGoogleApiKey: !!creds.googleApiKey
            });
            setCredentials(creds);
          }}
          onCredentialsChanged={(hasValid) => {
            console.log('🎯 BlogGenerator: Credentials changed, hasValid:', hasValid);
            setHasCredentials(hasValid);
          }}
        />
        
        {/* Debug: Credential Status */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <strong>🔍 Credential Status (Debug):</strong>
          <br />
          hasCredentials: {hasCredentials ? '✅ true' : '❌ false'}
          <br />
          credentials object: {credentials ? '✅ exists' : '❌ null'}
          <br />
          Email: {credentials?.email ? `✅ ${credentials.email}` : '❌ empty'}
          <br />
          Password: {credentials?.emailPassword ? '✅ set' : '❌ empty'}
          <br />
          Medium Username: {credentials?.mediumUsername ? `✅ ${credentials.mediumUsername}` : '❌ empty'}
          <br />
          Google API Key: {credentials?.googleApiKey ? '✅ Available' : '❌ Not set'}
          <br />
          Publish button: {(!credentials?.email || !credentials?.emailPassword || !credentials?.mediumUsername) ? '🔒 DISABLED (missing credentials)' : '✅ ENABLED'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Blog Configuration
            </CardTitle>
            <CardDescription>
              Provide your topic and preferences to generate a comprehensive blog post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Blog Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., The Future of Artificial Intelligence"
                value={blogInput.topic}
                onChange={(e) => setBlogInput(prev => ({ ...prev, topic: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={blogInput.tone} onValueChange={(value: any) => setBlogInput(prev => ({ ...prev, tone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                  <SelectItem value="informative">Informative</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience *</Label>
              <Textarea
                id="audience"
                placeholder="e.g., Tech professionals, startup founders, and AI enthusiasts"
                value={blogInput.targetAudience}
                onChange={(e) => setBlogInput(prev => ({ ...prev, targetAudience: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="keywords"
                  placeholder="Add a keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button onClick={addKeyword} variant="outline">Add</Button>
              </div>
              {blogInput.keywords && blogInput.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {blogInput.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={generateBlog} 
              disabled={isGenerating || !blogInput.topic || !blogInput.targetAudience}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Blog...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Generate Blog
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} />
                <p className="text-sm text-gray-500">
                  Researching sources and generating content...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Content
            </CardTitle>
            <CardDescription>
              Your AI-generated blog post with research insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {generatedBlog ? (
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="research">Research</TabsTrigger>
                  <TabsTrigger value="publish">Publish</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{generatedBlog.ontology.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {generatedBlog.ontology.estimatedReadTime} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Quality: {generatedBlog.generation_metadata.content_quality_score}/100
                      </span>
                    </div>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {generatedBlog.content}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div className="space-y-3">
                    {generatedBlog.ontology.seo && (
                      <>
                        <div>
                          <Label className="text-sm font-semibold">Meta Description</Label>
                          <p className="text-sm text-gray-600 mt-1">{generatedBlog.ontology.seo.metaDescription}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">URL Slug</Label>
                          <p className="text-sm text-gray-600 mt-1">{generatedBlog.ontology.seo.slug}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Primary Keywords</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {generatedBlog.ontology.seo.primaryKeywords.map((keyword, index) => (
                              <Badge key={index} variant="outline">{keyword}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {generatedBlog.ontology.seo_keywords && (
                      <div>
                        <Label className="text-sm font-semibold">SEO Keywords</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {generatedBlog.ontology.seo_keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-semibold">Hashtags</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {generatedBlog.ontology.hashtags.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="research" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{generatedBlog.research.newsArticles.length}</p>
                      <p className="text-sm text-gray-500">News Articles</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{generatedBlog.research.youtubeVideos.length}</p>
                      <p className="text-sm text-gray-500">YouTube Videos</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {generatedBlog.research.newsArticles.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Latest News Sources</h4>
                      <div className="space-y-2">
                        {generatedBlog.research.newsArticles.slice(0, 3).map((article, index) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium">{article.title}</p>
                            <p className="text-gray-500 text-xs">{article.source}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="publish" className="space-y-4">
                  {publishingResult ? (
                    <div className="text-center space-y-4">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                      <h3 className="text-xl font-semibold">Published Successfully!</h3>
                      <p className="text-gray-600">Your blog has been published to Medium.</p>
                      {publishingResult.mediumUrl && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">📖 Your Published Article:</p>
                          <a 
                            href={publishingResult.mediumUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm break-all block"
                          >
                            {publishingResult.mediumUrl}
                          </a>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(publishingResult.mediumUrl, '_blank')}
                            >
                              🚀 View Live Article
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(publishingResult.mediumUrl);
                                // Could add a toast notification here
                              }}
                            >
                              📋 Copy URL
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold">Ready to Publish</h3>
                        <p className="text-gray-600 text-sm">
                          Your blog post will be automatically published to Medium with the configured hashtags.
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => {
                          console.log('📤 Publish button clicked, current credentials:', {
                            hasCredentials: !!credentials,
                            email: credentials?.email,
                            mediumUsername: credentials?.mediumUsername,
                            hasPassword: !!credentials?.emailPassword
                          });
                          publishToMedium();
                        }} 
                        disabled={isPublishing || !credentials?.email || !credentials?.emailPassword || !credentials?.mediumUsername}
                        className="w-full"
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Publishing to Medium...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Publish to Medium
                          </>
                        )}
                      </Button>
                      
                      {(!credentials?.email || !credentials?.emailPassword || !credentials?.mediumUsername) && (
                        <Alert>
                          <AlertDescription>
                            ⚠️ <strong>Missing Credentials:</strong> Please enter your Medium publishing credentials in the form above:
                            <br />• Email: {credentials?.email ? '✅' : '❌ Required'}
                            <br />• Password: {credentials?.emailPassword ? '✅' : '❌ Required'} 
                            <br />• Medium Username: {credentials?.mediumUsername ? '✅' : '❌ Required'}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <p className="text-xs text-gray-500 text-center">
                        Publishing may take 1-2 minutes due to authentication process.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Generated content will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 