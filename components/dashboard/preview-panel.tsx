"use client"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { CheckCircle, Edit3, FileText, Search, Share2, ThumbsUp, UploadCloud } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import React from "react"

export function PreviewPanel() {
  const [isLoading, setIsLoading] = React.useState(true) // Simulate loading
  const [progress, setProgress] = React.useState(10)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000)
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return prev + Math.floor(Math.random() * 10) + 5
      })
    }, 500)
    return () => {
      clearTimeout(timer)
      clearInterval(progressTimer)
    }
  }, [])

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col shadow-lg dark:shadow-dark-surface/50">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="flex-grow space-y-4 p-6">
          <div className="text-center my-8">
            <div className="relative inline-block">
              <Progress
                value={Math.min(progress, 100)}
                className="w-48 h-48 rounded-full [&>*]:rounded-full"
                style={{ clipPath: "circle(50%)" }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary">{Math.min(progress, 100)}%</span>
                <p className="text-sm text-muted-foreground mt-1">Generating...</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-8">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md animate-pulse-subtle">
              <Skeleton className="h-5 w-1/3" /> <CheckCircle className="text-green-500 h-5 w-5" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md animate-pulse-subtle animation-delay-200">
              <Skeleton className="h-5 w-1/2" /> <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md animate-pulse-subtle animation-delay-400">
              <Skeleton className="h-5 w-2/5" /> <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-32 w-full mt-4" />
          <Skeleton className="h-16 w-full mt-2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col shadow-lg dark:shadow-dark-surface/50">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Generated Blog Post</CardTitle>
        <CardDescription>Preview your AI-generated content below. Make edits and publish.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-6 overflow-y-auto p-6 custom-scrollbar">
        <div className="prose dark:prose-invert max-w-none bg-muted/30 p-6 rounded-lg border">
          <h2 className="font-heading">The Future of AI in Healthcare: A Revolution is Coming</h2>
          <p>
            Artificial intelligence (AI) is no longer a futuristic concept; it's rapidly transforming industries
            worldwide, and healthcare is no exception. From diagnostics to drug discovery, AI promises to revolutionize
            how we approach medical care, making it more personalized, efficient, and accessible.
          </p>
          <p>
            One of the most significant impacts of AI in healthcare is in diagnostics. Machine learning algorithms can
            analyze medical images like X-rays, CT scans, and MRIs with remarkable accuracy, often detecting subtle
            patterns that might be missed by the human eye. This can lead to earlier diagnoses for conditions like
            cancer, diabetic retinopathy, and neurological disorders, ultimately improving patient outcomes.
          </p>
          {/* More placeholder content */}
          <p>...</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="bg-background text-foreground hover:bg-muted">
            <Edit3 className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" className="bg-background text-foreground hover:bg-muted">
            <ThumbsUp className="mr-2 h-4 w-4" /> Approve
          </Button>
        </div>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="seo">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <Search className="mr-2 h-5 w-5 text-accent" /> SEO Analysis
            </AccordionTrigger>
            <AccordionContent className="space-y-2 p-2">
              <p>Keyword Density: "AI in Healthcare" - 5% (Good)</p>
              <p>Meta Description: Generated and optimized.</p>
              <p>Readability Score: 75 (Good)</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="formatting">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <FileText className="mr-2 h-5 w-5 text-accent" /> Quick Formatting
            </AccordionTrigger>
            <AccordionContent className="flex gap-2 p-2">
              <Button variant="outline" size="sm" className="bg-background text-foreground">
                Bold
              </Button>
              <Button variant="outline" size="sm" className="bg-background text-foreground">
                Italic
              </Button>
              <Button variant="outline" size="sm" className="bg-background text-foreground">
                H2
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="publish">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <UploadCloud className="mr-2 h-5 w-5 text-accent" /> Publishing Options
            </AccordionTrigger>
            <AccordionContent className="space-y-4 p-2">
              <Card className="bg-background">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center gap-2">
                    <img src="/placeholder.svg?width=24&height=24" alt="Medium Logo" className="rounded-sm" /> Medium
                    Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Publish directly to your Medium account.</p>
                  <Button className="w-full bg-black text-white hover:bg-gray-800">Connect to Medium</Button>
                </CardContent>
              </Card>
              <div className="space-y-1">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" defaultValue="AI, Healthcare, Technology, Future" />
              </div>
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Share2 className="mr-2 h-4 w-4" /> Publish Now
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
