export interface BlogInput {
  topic: string;
  tone: 'formal' | 'casual' | 'persuasive' | 'informative' | 'conversational';
  targetAudience: string;
  keywords?: string[];
}

export interface BlogSection {
  heading: string;
  intent: 'intro' | 'main_point' | 'example' | 'counter_point' | 'conclusion' | 'cta' | 'hook_intro' | 'authority_building' | 'problem_exploration' | 'solution_framework' | 'case_study' | 'contrarian_view' | 'practical_action' | 'future_implications' | 'vulnerable_moment' | 'power_conclusion';
  paragraphs: string[];
  order: number;
  psychological_purpose?: string;
  key_points?: string[];
  engagement_strategy?: string;
  word_target?: string;
}

export interface BlogSEO {
  primaryKeywords: string[];
  metaDescription: string;
  readabilityScore: number;
  slug: string;
}

export interface EngagementElements {
  stories_needed: number;
  statistics_needed: number;
  questions_to_pose: string[];
  controversy_angle: string;
}

export interface BlogOntology {
  title: string;
  subtitle?: string;
  hook_statement?: string;
  target_word_count?: string;
  sections: BlogSection[];
  seo?: BlogSEO;
  estimatedReadTime: number | string;
  hashtags: string[];
  seo_keywords?: string[];
  psychological_hooks?: string[];
  engagement_elements?: EngagementElements;
}

export interface ResearchData {
  newsArticles: NewsArticle[];
  youtubeVideos: YouTubeVideo[];
  blogPosts: BlogPost[];
  searchResults: SearchResult[];
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  content?: string;
}

export interface YouTubeVideo {
  title: string;
  description: string;
  videoId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: any;
  transcript?: string;
}

export interface BlogPost {
  title: string;
  snippet: string;
  url: string;
  displayLink: string;
  formattedUrl: string;
}

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  displayLink: string;
}

export interface GeneratedBlog {
  ontology: BlogOntology;
  content: string;
  research: ResearchData;
  generation_metadata: {
    model_used: string;
    generation_time: number;
    research_sources_count: number;
    content_quality_score: number;
  };
}

export interface MediumPublishingOptions {
  tags: string[];
  publishStatus: 'public' | 'draft' | 'unlisted';
  notifyFollowers: boolean;
  license: 'all-rights-reserved' | 'cc-40-by' | 'cc-40-by-sa' | 'cc-40-by-nd' | 'cc-40-by-nc' | 'cc-40-by-nc-nd' | 'cc-40-by-nc-sa' | 'cc-40-zero' | 'public-domain';
}

export interface PublishingResult {
  success: boolean;
  mediumUrl?: string;
  error?: string;
  publishedAt?: string;
} 