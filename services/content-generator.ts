import { GoogleGenerativeAI } from '@google/generative-ai';
import { BlogInput, BlogOntology, BlogSection, ResearchData, GeneratedBlog } from '@/types/blog';
import { ResearchService } from './research';

export class ContentGeneratorService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private researchService: ResearchService;

  constructor(googleApiKey?: string) {
    const apiKey = googleApiKey || process.env.GOOGLE_API_KEY || '';
    if (!apiKey) {
      throw new Error('Google API key is required. Please provide it as a parameter or set GOOGLE_API_KEY environment variable.');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    this.researchService = new ResearchService(apiKey);
  }

  async generateBlog(input: BlogInput): Promise<GeneratedBlog> {
    const startTime = Date.now();
    
    try {
      // Step 1: Conduct comprehensive research
      console.log('🔍 Conducting research...');
      const research = await this.researchService.conductResearch(input.topic, input.keywords);
      
      // Step 2: Extract additional content from top sources
      const topUrls = [
        ...research.newsArticles.slice(0, 3).map(article => article.url),
        ...research.blogPosts.slice(0, 2).map(post => post.url)
      ];
      const extractedContent = await this.researchService.extractWebContent(topUrls);
      
      // Step 3: Generate blog ontology (structure)
      console.log('📝 Generating blog structure...');
      const ontology = await this.generateBlogOntology(input, research);
      
      // Step 4: Generate content for each section using RAG
      console.log('✍️ Generating content...');
      const enhancedOntology = await this.generateSectionContent(ontology, input, research, extractedContent);
      
      // Step 5: Compile final blog content
      const finalContent = this.compileBlogContent(enhancedOntology);
      
      // Step 6: Calculate quality metrics
      const qualityScore = this.calculateContentQuality(finalContent, research);
      
      const generationTime = Date.now() - startTime;
      
      return {
        ontology: enhancedOntology,
        content: finalContent,
        research,
        generation_metadata: {
          model_used: 'gemini-2.0-flash',
          generation_time: generationTime,
          research_sources_count: this.countResearchSources(research),
          content_quality_score: qualityScore
        }
      };
    } catch (error) {
      console.error('Error generating blog:', error);
      throw new Error(`Blog generation failed: ${error}`);
    }
  }

  private async generateBlogOntology(input: BlogInput, research: ResearchData): Promise<BlogOntology> {
    console.log('📝 Generating blog structure...');
    
    const researchContext = this.buildResearchContext(research);
    
    // Expert-level structure with strategic psychological hooks
    const ontologyPrompt = `
You are a master technical writer with 30+ years of experience writing viral Medium articles. 
You understand psychology, SEO, and reader engagement at an expert level.

Create a comprehensive blog structure for: "${input.topic}"

Target Audience: ${input.targetAudience}
Tone: ${input.tone}
Keywords: ${input.keywords?.join(', ') || 'None specified'}

Research Context:
${researchContext}

EXPERT STRUCTURE REQUIREMENTS:
1. **Hook-driven opening** - Start with a compelling story, statistic, or controversial statement
2. **Strategic vulnerability** - Include deliberate "human moments" that build trust
3. **Authority building** - Weave in credible sources and data points
4. **Engagement loops** - Each section should create curiosity for the next
5. **Practical value** - Every section must provide actionable insights
6. **Social proof** - Include examples, case studies, or testimonials where relevant
7. **Emotional resonance** - Connect with reader's pain points and aspirations
8. **Strategic controversy** - Include thought-provoking perspectives (not offensive)
9. **SEO optimization** - Natural keyword integration throughout
10. **Memorable conclusion** - End with a strong call-to-action or philosophical insight

SECTION TYPES & PSYCHOLOGY:
- **hook_intro**: Grab attention with story/statistic/question that creates information gap
- **authority_building**: Establish credibility without being boastful
- **problem_exploration**: Dive deep into pain points (build emotional connection)
- **solution_framework**: Present your core methodology/approach
- **case_study**: Real-world examples that prove your points
- **contrarian_view**: Address common misconceptions or present alternative perspectives
- **practical_action**: Step-by-step guidance readers can implement immediately
- **future_implications**: Where this topic is heading (creates urgency)
- **vulnerable_moment**: Personal story or admission that humanizes you
- **power_conclusion**: Memorable ending that inspires action

Generate a JSON structure with:
{
  "title": "Compelling, SEO-optimized title (8-12 words)",
  "subtitle": "Engaging subtitle that expands on the title",
  "hook_statement": "Opening line that creates immediate curiosity",
  "target_word_count": "Optimal word count for this topic (1200-2500)",
  "estimated_read_time": "Reading time in minutes",
  "seo_keywords": ["primary", "secondary", "long-tail"],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "psychological_hooks": ["hook1", "hook2", "hook3"],
  "sections": [
    {
      "heading": "Section title",
      "intent": "section_type_from_above",
      "psychological_purpose": "Why this section exists psychologically",
      "key_points": ["point1", "point2", "point3"],
      "engagement_strategy": "How to keep readers engaged",
      "word_target": "Target word count for this section",
      "order": 1
    }
  ],
  "engagement_elements": {
    "stories_needed": 2,
    "statistics_needed": 3,
    "questions_to_pose": ["question1", "question2"],
    "controversy_angle": "Thought-provoking perspective to include"
  }
}

Make this structure VIRAL-WORTHY. Think like a content strategist who understands human psychology.
`;

    try {
      const result = await this.model.generateContent(ontologyPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const ontologyData = JSON.parse(jsonMatch[0]);
      
      // Transform to our structure
      const ontology: BlogOntology = {
        title: ontologyData.title,
        subtitle: ontologyData.subtitle,
        hook_statement: ontologyData.hook_statement,
        target_word_count: ontologyData.target_word_count,
        estimatedReadTime: ontologyData.estimated_read_time,
        hashtags: ontologyData.hashtags,
        seo_keywords: ontologyData.seo_keywords,
        psychological_hooks: ontologyData.psychological_hooks,
        engagement_elements: ontologyData.engagement_elements,
        sections: ontologyData.sections.map((section: any) => ({
          heading: section.heading,
          intent: section.intent,
          psychological_purpose: section.psychological_purpose,
          key_points: section.key_points,
          engagement_strategy: section.engagement_strategy,
          word_target: section.word_target,
          paragraphs: [],
          order: section.order
        }))
      };
      
      return ontology;
      
    } catch (error) {
      console.error('Error parsing ontology JSON:', error);
      return this.createExpertFallbackOntology(input);
    }
  }

  private async generateSectionContent(
    ontology: BlogOntology,
    input: BlogInput,
    research: ResearchData,
    extractedContent: Array<{url: string, content: string}>
  ): Promise<BlogOntology> {
    const enhancedSections = await Promise.all(
      ontology.sections.map(async (section) => {
        const sectionContent = await this.generateSectionParagraphs(
          section,
          input,
          research,
          extractedContent,
          ontology.title
        );
        
        return {
          ...section,
          paragraphs: sectionContent
        };
      })
    );

    return {
      ...ontology,
      sections: enhancedSections
    };
  }

  private async generateSectionParagraphs(
    section: BlogSection,
    input: BlogInput,
    research: ResearchData,
    extractedContent: Array<{url: string, content: string}>,
    blogTitle: string
  ): Promise<string[]> {
    const relevantResearch = this.getRelevantResearchForSection(section, research);
    const relevantContent = extractedContent.filter(content => 
      content.content.toLowerCase().includes(section.heading.toLowerCase().split(' ')[0])
    ).slice(0, 2);

    // Expert-level content generation with psychological principles
    const prompt = `
You are a master Medium writer with 30+ years of experience. Write compelling content for this section:

ARTICLE CONTEXT:
Title: ${blogTitle}
Section: ${section.heading}
Intent: ${section.intent}
Psychological Purpose: ${section.psychological_purpose}
Key Points to Cover: ${section.key_points?.join(', ') || 'Not specified'}
Engagement Strategy: ${section.engagement_strategy}
Target Word Count: ${section.word_target}
Overall Tone: ${input.tone}
Target Audience: ${input.targetAudience}

Research Data:
${relevantResearch}

Additional Context:
${relevantContent.map(c => c.content.substring(0, 500)).join('\n\n')}

EXPERT WRITING REQUIREMENTS:
🎯 **Psychological Hooks**: Use curiosity gaps, pattern interrupts, and emotional triggers
📊 **Authority Building**: Integrate data, research, and credible sources naturally
💡 **Practical Value**: Every paragraph must provide actionable insights
🔥 **Engagement**: Use storytelling, analogies, and conversational language
🎭 **Vulnerability**: Include human moments that build trust and connection
🚀 **Forward Momentum**: Each paragraph should create desire to read the next
📱 **Medium Optimization**: Use formatting, subheadings, and scannable structure
🎪 **Controlled Chaos**: Strategic imperfection that feels authentic

SECTION-SPECIFIC INSTRUCTIONS:
${this.getSectionSpecificInstructions(section.intent)}

FORMATTING GUIDELINES:
- Use short paragraphs (1-3 sentences)
- Include subheadings for scanability
- Use bullet points for key insights
- Include rhetorical questions
- Add transitional phrases that create flow
- Use power words and emotional language
- Include specific numbers and data points
- End with a hook for the next section

Return the content as complete paragraphs, properly formatted for Medium.
`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Split into paragraphs and clean up
    const paragraphs = text.split('\n\n')
      .filter((p: string) => p.trim().length > 30)
      .map((p: string) => p.trim().replace(/^\d+\.\s*/, '')) // Remove numbering
      .slice(0, 6); // Limit to 6 paragraphs per section

    return paragraphs.length > 0 ? paragraphs : [`Expert content for ${section.heading} goes here.`];
  }

  private getSectionSpecificInstructions(intent: string): string {
    const instructions = {
      'hook_intro': `
        - Start with a compelling story, shocking statistic, or thought-provoking question
        - Create an information gap that makes readers want to continue
        - Establish emotional connection with the reader's situation
        - Promise specific value they'll get from reading
        - Use the "but here's the thing..." pattern to create intrigue
      `,
      'authority_building': `
        - Weave in credible sources and research naturally
        - Share relevant experience without being boastful
        - Use specific numbers and case studies
        - Reference industry leaders or respected publications
        - Build trust through transparent methodology
      `,
      'problem_exploration': `
        - Dive deep into the reader's pain points
        - Use empathetic language that shows understanding
        - Present the full scope of the problem
        - Use analogies to make complex issues relatable
        - Create urgency around solving this problem
      `,
      'solution_framework': `
        - Present your core methodology clearly
        - Break down complex concepts into digestible parts
        - Use frameworks and step-by-step approaches
        - Provide mental models for understanding
        - Make it immediately actionable
      `,
      'case_study': `
        - Use specific, real-world examples
        - Include before/after scenarios
        - Provide concrete numbers and results
        - Tell the story with narrative structure
        - Connect back to the reader's situation
      `,
      'contrarian_view': `
        - Challenge common assumptions respectfully
        - Present alternative perspectives
        - Use data to support contrarian viewpoints
        - Acknowledge other valid approaches
        - Create thought-provoking discussions
      `,
      'practical_action': `
        - Provide step-by-step guidance
        - Include specific tools and resources
        - Make it immediately implementable
        - Address common obstacles
        - Give readers a quick win
      `,
      'future_implications': `
        - Discuss where the topic is heading
        - Create urgency around current opportunities
        - Reference emerging trends and technologies
        - Help readers stay ahead of the curve
        - Connect to broader industry shifts
      `,
      'vulnerable_moment': `
        - Share a personal story or struggle
        - Admit mistakes or learning moments
        - Show your human side
        - Connect emotionally with readers
        - Build trust through authenticity
      `,
      'power_conclusion': `
        - Summarize key insights powerfully
        - Issue a clear call-to-action
        - Leave readers with a memorable quote or insight
        - Create desire for next steps
        - End with inspiration or motivation
      `
    };

    return instructions[intent as keyof typeof instructions] || `
      - Create engaging, valuable content for this section
      - Use storytelling and specific examples
      - Maintain reader interest throughout
      - Provide actionable insights
      - Connect to the overall article theme
    `;
  }

  private buildResearchContext(research: ResearchData): string {
    let context = '';
    
    if (research.newsArticles.length > 0) {
      context += 'Recent News:\n';
      research.newsArticles.slice(0, 3).forEach(article => {
        context += `- ${article.title}: ${article.description}\n`;
      });
      context += '\n';
    }
    
    if (research.youtubeVideos.length > 0) {
      context += 'YouTube Videos:\n';
      research.youtubeVideos.slice(0, 3).forEach(video => {
        context += `- ${video.title} by ${video.channelTitle}\n`;
      });
      context += '\n';
    }
    
    if (research.blogPosts.length > 0) {
      context += 'Related Blog Posts:\n';
      research.blogPosts.slice(0, 3).forEach(post => {
        context += `- ${post.title}: ${post.snippet}\n`;
      });
    }
    
    return context || 'No specific research context available.';
  }

  private getRelevantResearchForSection(section: BlogSection, research: ResearchData): string {
    const sectionKeywords = section.heading.toLowerCase().split(' ');
    let relevantContent = '';
    
    // Find relevant news articles
    const relevantNews = research.newsArticles.filter(article =>
      sectionKeywords.some(keyword => 
        article.title.toLowerCase().includes(keyword) ||
        article.description.toLowerCase().includes(keyword)
      )
    ).slice(0, 2);
    
    if (relevantNews.length > 0) {
      relevantContent += 'Relevant News:\n';
      relevantNews.forEach(article => {
        relevantContent += `- ${article.title}: ${article.description}\n`;
      });
    }
    
    return relevantContent || 'No section-specific research available.';
  }

  private compileBlogContent(ontology: BlogOntology): string {
    let content = `# ${ontology.title}\n\n`;
    
    ontology.sections
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        content += `## ${section.heading}\n\n`;
        section.paragraphs.forEach(paragraph => {
          content += `${paragraph}\n\n`;
        });
      });
    
    return content;
  }

  private calculateContentQuality(content: string, research: ResearchData): number {
    let score = 0;
    
    // Length check (500-3000 words is ideal)
    const wordCount = content.split(' ').length;
    if (wordCount >= 500 && wordCount <= 3000) score += 25;
    else if (wordCount >= 300) score += 15;
    
    // Research integration
    const researchSourcesUsed = this.countResearchSources(research);
    if (researchSourcesUsed >= 5) score += 25;
    else if (researchSourcesUsed >= 3) score += 15;
    
    // Structure quality
    const headingCount = (content.match(/##/g) || []).length;
    if (headingCount >= 5 && headingCount <= 8) score += 25;
    else if (headingCount >= 3) score += 15;
    
    // Content richness
    if (content.includes('example') || content.includes('case study')) score += 12.5;
    if (content.includes('data') || content.includes('research') || content.includes('study')) score += 12.5;
    
    return Math.min(score, 100);
  }

  private countResearchSources(research: ResearchData): number {
    return research.newsArticles.length + 
           research.youtubeVideos.length + 
           research.blogPosts.length + 
           research.searchResults.length;
  }

  private createExpertFallbackOntology(input: BlogInput): BlogOntology {
    // Expert fallback structure with psychological hooks
    return {
      title: `${input.topic}: The Definitive Guide Nobody Talks About`,
      subtitle: `What 99% of people get wrong about ${input.topic}`,
      hook_statement: `Here's the uncomfortable truth about ${input.topic} that most experts won't tell you...`,
      target_word_count: '1800-2200',
      estimatedReadTime: '8-10',
      hashtags: [`#${input.topic.replace(/\s+/g, '')}`, '#Strategy', '#Growth', '#Leadership', '#Innovation'],
      seo_keywords: [input.topic, `${input.topic} strategy`, `${input.topic} guide`],
      psychological_hooks: ['curiosity gap', 'social proof', 'authority building'],
      engagement_elements: {
        stories_needed: 2,
        statistics_needed: 3,
        questions_to_pose: ['What if everything you know is wrong?', 'Why do most people fail at this?'],
        controversy_angle: 'Challenge conventional wisdom'
      },
      sections: [
        {
          heading: 'The Uncomfortable Truth Most Experts Won\'t Tell You',
          intent: 'hook_intro',
          psychological_purpose: 'Create curiosity and challenge assumptions',
          key_points: ['Reveal hidden problem', 'Challenge status quo', 'Promise insider knowledge'],
          engagement_strategy: 'Use controversial opening that demands attention',
          word_target: '200-300',
          paragraphs: [],
          order: 1
        },
        {
          heading: 'Why 99% of People Get This Wrong',
          intent: 'problem_exploration',
          psychological_purpose: 'Build emotional connection through shared frustration',
          key_points: ['Common mistakes', 'Root causes', 'Hidden obstacles'],
          engagement_strategy: 'Use empathy and specific examples',
          word_target: '300-400',
          paragraphs: [],
          order: 2
        },
        {
          heading: 'The Framework That Changes Everything',
          intent: 'solution_framework',
          psychological_purpose: 'Provide clear path forward',
          key_points: ['Core methodology', 'Step-by-step approach', 'Mental models'],
          engagement_strategy: 'Make complex simple with frameworks',
          word_target: '400-500',
          paragraphs: [],
          order: 3
        },
        {
          heading: 'Real Results: What Happens When You Get It Right',
          intent: 'case_study',
          psychological_purpose: 'Provide social proof and inspiration',
          key_points: ['Success stories', 'Concrete outcomes', 'Transformation examples'],
          engagement_strategy: 'Use specific numbers and before/after scenarios',
          word_target: '300-400',
          paragraphs: [],
          order: 4
        },
        {
          heading: 'The Contrarian Approach That Actually Works',
          intent: 'contrarian_view',
          psychological_purpose: 'Challenge thinking and create memorable insight',
          key_points: ['Alternative perspective', 'Unconventional wisdom', 'Why it works'],
          engagement_strategy: 'Present thought-provoking alternative',
          word_target: '250-350',
          paragraphs: [],
          order: 5
        },
        {
          heading: 'Your Next Move: The 5-Step Action Plan',
          intent: 'practical_action',
          psychological_purpose: 'Provide immediate value and momentum',
          key_points: ['Actionable steps', 'Immediate wins', 'Resources needed'],
          engagement_strategy: 'Give readers something to do right now',
          word_target: '300-400',
          paragraphs: [],
          order: 6
        },
        {
          heading: 'The Future Belongs to Those Who Act Now',
          intent: 'power_conclusion',
          psychological_purpose: 'Create urgency and inspire action',
          key_points: ['Future implications', 'Call to action', 'Inspirational close'],
          engagement_strategy: 'End with power and momentum',
          word_target: '200-300',
          paragraphs: [],
          order: 7
        }
      ]
    };
  }
} 