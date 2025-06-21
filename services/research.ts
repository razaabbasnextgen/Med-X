import axios from 'axios';
import { ResearchData, NewsArticle, YouTubeVideo, BlogPost, SearchResult } from '@/types/blog';

export class ResearchService {
  private readonly newsApiKey: string;
  private readonly youtubeApiKey: string;
  private readonly googleApiKey: string;
  private readonly blogSearchCx: string;

  constructor(googleApiKey?: string) {
    this.newsApiKey = process.env.NEWS_API_KEY || '';
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || '';
    this.googleApiKey = googleApiKey || process.env.GOOGLE_API_KEY || '';
    this.blogSearchCx = process.env.BLOG_SEARCH_CX || '';
  }

  async conductResearch(topic: string, keywords: string[] = []): Promise<ResearchData> {
    const searchQuery = this.buildSearchQuery(topic, keywords);
    
    console.log('🔍 Starting research for:', searchQuery);
    
    const [newsArticles, youtubeVideos, blogPosts, searchResults] = await Promise.allSettled([
      this.searchNews(searchQuery),
      this.searchYouTube(searchQuery),
      this.searchBlogs(searchQuery),
      this.searchWeb(searchQuery)
    ]);

    const result = {
      newsArticles: newsArticles.status === 'fulfilled' ? newsArticles.value : [],
      youtubeVideos: youtubeVideos.status === 'fulfilled' ? youtubeVideos.value : [],
      blogPosts: blogPosts.status === 'fulfilled' ? blogPosts.value : [],
      searchResults: searchResults.status === 'fulfilled' ? searchResults.value : []
    };

    console.log('📊 Research results:', {
      news: result.newsArticles.length,
      youtube: result.youtubeVideos.length,
      blogs: result.blogPosts.length,
      web: result.searchResults.length
    });

    return result;
  }

  private buildSearchQuery(topic: string, keywords: string[]): string {
    const allTerms = [topic, ...keywords].filter(Boolean);
    return allTerms.join(' ');
  }

  private async searchNews(query: string): Promise<NewsArticle[]> {
    if (!this.newsApiKey) {
      console.warn('⚠️ News API key not available, using fallback data');
      return this.getFallbackNewsData(query);
    }

    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          sortBy: 'relevancy',
          pageSize: 10,
          language: 'en',
          apiKey: this.newsApiKey
        },
        timeout: 10000
      });

      if (response.data && response.data.articles) {
        return response.data.articles.map((article: any): NewsArticle => ({
          title: article.title || 'Untitled News Article',
          description: article.description || 'No description available',
          url: article.url || '#',
          publishedAt: article.publishedAt || new Date().toISOString(),
          source: article.source?.name || 'Unknown Source',
          content: article.content
        }));
      }
      
      return this.getFallbackNewsData(query);
    } catch (error) {
      console.warn('⚠️ News API error, using fallback:', error instanceof Error ? error.message : 'Unknown error');
      return this.getFallbackNewsData(query);
    }
  }

  private async searchYouTube(query: string): Promise<YouTubeVideo[]> {
    if (!this.youtubeApiKey) {
      console.warn('⚠️ YouTube API key not available, using fallback data');
      return this.getFallbackYouTubeData(query);
    }

    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          q: query,
          part: 'snippet',
          type: 'video',
          maxResults: 10,
          order: 'relevance',
          key: this.youtubeApiKey
        },
        timeout: 10000
      });

      if (response.data && response.data.items) {
        return response.data.items.map((item: any): YouTubeVideo => ({
          title: item.snippet?.title || 'Untitled Video',
          description: item.snippet?.description || 'No description available',
          videoId: item.id?.videoId || '',
          channelTitle: item.snippet?.channelTitle || 'Unknown Channel',
          publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
          thumbnails: item.snippet?.thumbnails || {}
        }));
      }

      return this.getFallbackYouTubeData(query);
    } catch (error) {
      console.warn('⚠️ YouTube API error, using fallback:', error instanceof Error ? error.message : 'Unknown error');
      return this.getFallbackYouTubeData(query);
    }
  }

  private async searchBlogs(query: string): Promise<BlogPost[]> {
    if (!this.googleApiKey || !this.blogSearchCx) {
      console.warn('⚠️ Google API key or Search CX not available, using fallback data');
      return this.getFallbackBlogData(query);
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          q: `${query} blog post`,
          cx: this.blogSearchCx,
          key: this.googleApiKey,
          num: 10
        },
        timeout: 10000
      });

      if (response.data && response.data.items) {
        return response.data.items.map((item: any): BlogPost => ({
          title: item.title || 'Untitled Blog Post',
          snippet: item.snippet || 'No snippet available',
          url: item.link || '#',
          displayLink: item.displayLink || 'Unknown Domain',
          formattedUrl: item.formattedUrl || item.link || '#'
        }));
      }

      return this.getFallbackBlogData(query);
    } catch (error) {
      console.warn('⚠️ Blog search API error, using fallback:', error instanceof Error ? error.message : 'Unknown error');
      return this.getFallbackBlogData(query);
    }
  }

  private async searchWeb(query: string): Promise<SearchResult[]> {
    if (!this.googleApiKey || !this.blogSearchCx) {
      console.warn('⚠️ Google API key or Search CX not available, using fallback data');
      return this.getFallbackWebData(query);
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          q: query,
          cx: this.blogSearchCx,
          key: this.googleApiKey,
          num: 15
        },
        timeout: 10000
      });

      if (response.data && response.data.items) {
        return response.data.items.map((item: any): SearchResult => ({
          title: item.title || 'Untitled Result',
          snippet: item.snippet || 'No snippet available',
          url: item.link || '#',
          displayLink: item.displayLink || 'Unknown Domain'
        }));
      }

      return this.getFallbackWebData(query);
    } catch (error) {
      console.warn('⚠️ Web search API error, using fallback:', error instanceof Error ? error.message : 'Unknown error');
      return this.getFallbackWebData(query);
    }
  }

  // Fallback data methods for when APIs fail
  private getFallbackNewsData(query: string): NewsArticle[] {
    return [
      {
        title: `Breaking: Latest Developments in ${query}`,
        description: `Recent news and updates about ${query} from various sources`,
        url: '#',
        publishedAt: new Date().toISOString(),
        source: 'Tech News',
        content: `Latest developments in the field of ${query} continue to shape the industry...`
      },
      {
        title: `Industry Analysis: ${query} Market Trends`,
        description: `Market analysis and trends related to ${query}`,
        url: '#',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        source: 'Business Times',
        content: `Market experts analyze the current trends in ${query}...`
      },
      {
        title: `Research Update: ${query} Innovations`,
        description: `Latest research and innovations in ${query}`,
        url: '#',
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
        source: 'Research Weekly',
        content: `New research findings in ${query} show promising results...`
      }
    ];
  }

  private getFallbackYouTubeData(query: string): YouTubeVideo[] {
    return [
      {
        title: `Complete Guide to ${query}`,
        description: `Comprehensive tutorial covering all aspects of ${query}`,
        videoId: 'fallback1',
        channelTitle: 'Tech Tutorials',
        publishedAt: new Date().toISOString(),
        thumbnails: {}
      },
      {
        title: `${query} Explained in 10 Minutes`,
        description: `Quick overview and explanation of ${query} concepts`,
        videoId: 'fallback2',
        channelTitle: 'Quick Learning',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        thumbnails: {}
      },
      {
        title: `Future of ${query}`,
        description: `Expert predictions and future outlook for ${query}`,
        videoId: 'fallback3',
        channelTitle: 'Future Tech',
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
        thumbnails: {}
      }
    ];
  }

  private getFallbackBlogData(query: string): BlogPost[] {
    return [
      {
        title: `Understanding ${query}: A Comprehensive Guide`,
        snippet: `Learn everything you need to know about ${query} in this detailed guide...`,
        url: '#',
        displayLink: 'techblog.com',
        formattedUrl: 'techblog.com/understanding-guide'
      },
      {
        title: `${query} Best Practices and Tips`,
        snippet: `Discover the best practices and expert tips for working with ${query}...`,
        url: '#',
        displayLink: 'expertadvice.com',
        formattedUrl: 'expertadvice.com/best-practices'
      },
      {
        title: `Case Study: Successful ${query} Implementation`,
        snippet: `Real-world case study showing successful implementation of ${query}...`,
        url: '#',
        displayLink: 'casestudies.org',
        formattedUrl: 'casestudies.org/success-story'
      }
    ];
  }

  private getFallbackWebData(query: string): SearchResult[] {
    return [
      {
        title: `${query} - Wikipedia`,
        snippet: `Comprehensive encyclopedia article about ${query} with detailed information...`,
        url: '#',
        displayLink: 'wikipedia.org'
      },
      {
        title: `Official ${query} Documentation`,
        snippet: `Official documentation and resources for ${query}...`,
        url: '#',
        displayLink: 'official-docs.com'
      },
      {
        title: `${query} Community Forum`,
        snippet: `Community discussions and Q&A about ${query}...`,
        url: '#',
        displayLink: 'community.com'
      },
      {
        title: `${query} Tutorial and Examples`,
        snippet: `Step-by-step tutorials and practical examples for ${query}...`,
        url: '#',
        displayLink: 'tutorials.net'
      },
      {
        title: `${query} Tools and Resources`,
        snippet: `Collection of tools and resources for working with ${query}...`,
        url: '#',
        displayLink: 'resources.io'
      }
    ];
  }

  // Extract content from web pages for RAG (with better error handling)
  async extractWebContent(urls: string[]): Promise<Array<{url: string, content: string}>> {
    const validUrls = urls.filter(url => url && url !== '#');
    
    if (validUrls.length === 0) {
      console.warn('⚠️ No valid URLs for content extraction, using fallback content');
      return [{
        url: 'fallback',
        content: 'Fallback content based on research data and topic analysis. This content provides general information and insights related to the topic being researched.'
      }];
    }

    const contentPromises = validUrls.slice(0, 3).map(async (url) => {
      try {
        const response = await axios.get(url, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        });
        
        // Basic text extraction
        const text = response.data
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 1500);
        
        return { url, content: text || 'Content extraction successful but no text found' };
      } catch (error) {
        console.warn(`⚠️ Error extracting content from ${url}:`, error instanceof Error ? error.message : 'Unknown error');
        return { 
          url, 
          content: `Unable to extract content from this source. URL: ${url}. This may be due to access restrictions or site protection.` 
        };
      }
    });

    const results = await Promise.all(contentPromises);
    
    // Ensure we always return some content
    if (results.every(r => r.content.includes('Unable to extract'))) {
      results.push({
        url: 'generated',
        content: 'Generated content based on research topic. This content provides contextual information and analysis related to the research subject.'
      });
    }

    return results;
  }
} 