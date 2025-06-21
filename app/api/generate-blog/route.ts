import { NextRequest, NextResponse } from 'next/server';
import { ContentGeneratorService } from '@/services/content-generator';
import { BlogInput } from '@/types/blog';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🚀 Blog Generation API - Request body:', {
      hasTopic: !!body.topic,
      hasTone: !!body.tone,
      hasTargetAudience: !!body.targetAudience,
      hasCredentials: !!body.credentials,
      hasGoogleApiKey: !!body.credentials?.googleApiKey
    });

    const { topic, tone, targetAudience, keywords, credentials }: BlogInput & { 
      credentials?: { googleApiKey: string } 
    } = body;

    // Validate input
    if (!topic || !tone || !targetAudience) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: topic, tone, and targetAudience are required' 
        },
        { status: 400 }
      );
    }

    const validTones = ['formal', 'casual', 'persuasive', 'informative', 'conversational'];
    if (!validTones.includes(tone)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid tone. Must be one of: ${validTones.join(', ')}` 
        },
        { status: 400 }
      );
    }

    console.log('🚀 Starting blog generation for topic:', topic);

    // Get Google API key - prioritize user-provided credentials
    let googleApiKey = credentials?.googleApiKey;
    
    if (!googleApiKey) {
      // No credentials provided, try to load saved credentials
      try {
        const host = req.headers.get('host') || 'localhost:3000';
        let baseUrl: string;
        
        if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168.') || host.includes('10.23.59.')) {
          baseUrl = `http://${host}`;
        } else {
          baseUrl = `https://${host}`;
        }
        
        console.log(`🔍 Loading saved credentials for Google API key from: ${baseUrl}/api/credentials`);
        const credResponse = await fetch(`${baseUrl}/api/credentials?includePassword=true`);
        const credData = await credResponse.json();
        
        if (credData.hasCredentials && credData.googleApiKey) {
          googleApiKey = credData.googleApiKey;
          console.log('💾 Using saved Google API key from file');
        }
      } catch (error) {
        console.log('⚠️ Could not load saved Google API key, falling back to environment variables');
        console.error('Credentials fetch error:', error);
      }
    }

    // Final fallback to environment variable
    if (!googleApiKey) {
      googleApiKey = process.env.GOOGLE_API_KEY;
      console.log('🔧 Using Google API key from environment variables');
    }

    if (!googleApiKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Google API key is required. Please provide it via credentials or set GOOGLE_API_KEY environment variable.' 
        },
        { status: 400 }
      );
    }

    // Initialize the content generator with dynamic credentials
    const contentGenerator = new ContentGeneratorService(googleApiKey);

    // Generate the blog
    const generatedBlog = await contentGenerator.generateBlog({
      topic,
      tone,
      targetAudience,
      keywords: keywords || []
    });

    console.log('✅ Blog generation completed successfully');

    return NextResponse.json({
      success: true,
      data: generatedBlog
    });

  } catch (error) {
    console.error('❌ Error in blog generation API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Blog generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Blog Generation API',
    endpoints: {
      POST: '/api/generate-blog - Generate a blog from topic and preferences',
    },
    requiredFields: {
      topic: 'string - The main topic of the blog',
      tone: 'string - formal | casual | persuasive | informative | conversational',
      targetAudience: 'string - Description of the target audience',
      keywords: 'string[] - Optional array of keywords'
    }
  });
} 