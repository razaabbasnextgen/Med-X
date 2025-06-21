"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Bot, Feather, MessageSquare, Smile, Sparkles, UserCheck, Users, X } from "lucide-react"
import React from "react"

export function InputPanel() {
  const [keywords, setKeywords] = React.useState<string[]>(["AI", "Healthcare", "Future"])
  const [currentKeyword, setCurrentKeyword] = React.useState("")

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      setKeywords([...keywords, currentKeyword.trim()])
      setCurrentKeyword("")
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove))
  }

  return (
    <Card className="h-full flex flex-col shadow-lg dark:shadow-dark-surface/50">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Generate New Blog</CardTitle>
        <CardDescription>Fill in the details to generate your AI-powered blog post.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-6 overflow-y-auto p-6 custom-scrollbar">
        <div className="floating-label-input">
          <Input id="blogTitle" placeholder=" " />
          <Label htmlFor="blogTitle">Blog Title / Main Topic</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords</Label>
          <div className="flex gap-2">
            <Input
              id="keywords"
              placeholder="Add a keyword"
              value={currentKeyword}
              onChange={(e) => setCurrentKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
            />
            <Button
              onClick={handleAddKeyword}
              variant="outline"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="text-sm py-1 px-3 group relative hover:bg-destructive hover:text-destructive-foreground transition-all"
              >
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tone Selector</Label>
          <RadioGroup defaultValue="neutral" className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { value: "formal", label: "Formal", icon: <Feather size={18} /> },
              { value: "casual", label: "Casual", icon: <Smile size={18} /> },
              { value: "informative", label: "Informative", icon: <Bot size={18} /> },
              { value: "witty", label: "Witty", icon: <Sparkles size={18} /> },
              { value: "persuasive", label: "Persuasive", icon: <MessageSquare size={18} /> },
            ].map((tone) => (
              <Label
                key={tone.value}
                htmlFor={`tone-${tone.value}`}
                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
              >
                <RadioGroupItem value={tone.value} id={`tone-${tone.value}`} className="sr-only" />
                {tone.icon}
                <span className="mt-2 text-sm font-medium">{tone.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Select>
            <SelectTrigger id="targetAudience">
              <SelectValue placeholder="Select target audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                <div className="flex items-center gap-2">
                  <Users size={16} /> General Public
                </div>
              </SelectItem>
              <SelectItem value="experts">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} /> Industry Experts
                </div>
              </SelectItem>
              <SelectItem value="beginners">
                <div className="flex items-center gap-2">
                  <Feather size={16} /> Beginners
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="floating-label-input">
          <Textarea id="additionalContext" placeholder=" " className="min-h-[100px]" />
          <Label htmlFor="additionalContext">Additional Context / Instructions</Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Sparkles className="mr-2 h-5 w-5" /> Generate Blog
        </Button>
      </CardFooter>
    </Card>
  )
}
