import { NextRequest, NextResponse } from 'next/server';
import { MediumPublisherService } from '@/services/medium-publisher';
import { GeneratedBlog, MediumPublishingOptions } from '@/types/blog';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📤 Medium Publishing API - Request received:', {
      hasBlog: !!body.blog,
      hasPublishingOptions: !!body.publishingOptions,
      hasCredentials: !!body.credentials
    });

    const { blog, publishingOptions, credentials } = body;

    // Validate required data
    if (!blog || !blog.content || !blog.ontology?.title) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid blog data provided' 
        },
        { status: 400 }
      );
    }

    if (!publishingOptions) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Publishing options are required' 
        },
        { status: 400 }
      );
    }

    console.log('📤 Medium Publishing - Blog data validation passed');

    // Get Medium credentials - prioritize user-provided credentials
    let mediumCredentials = credentials;
    
    if (!mediumCredentials?.email || !mediumCredentials?.emailPassword || !mediumCredentials?.mediumUsername) {
      // No complete credentials provided, try to load saved credentials
      try {
        const host = req.headers.get('host') || 'localhost:3000';
        let baseUrl: string;
        
        if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168.') || host.includes('10.23.59.')) {
          baseUrl = `http://${host}`;
        } else {
          baseUrl = `https://${host}`;
        }
        
        console.log(`🔍 Loading saved credentials from: ${baseUrl}/api/credentials`);
        const credResponse = await fetch(`${baseUrl}/api/credentials?includePassword=true`);
        const credData = await credResponse.json();
        
        if (credData.hasCredentials && credData.email && credData.emailPassword && credData.mediumUsername) {
          mediumCredentials = {
            email: credData.email,
            emailPassword: credData.emailPassword,
            mediumUsername: credData.mediumUsername
          };
          console.log('💾 Using saved Medium credentials from file');
        }
      } catch (error) {
        console.error('Credentials fetch error:', error);
      }
    }

    // Validate we have complete credentials
    if (!mediumCredentials?.email || !mediumCredentials?.emailPassword || !mediumCredentials?.mediumUsername) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Complete Medium publishing credentials required: email, password, and Medium username' 
        },
        { status: 400 }
      );
    }

    console.log('📤 Medium Publishing - Starting automated publishing process');

    // Initialize Medium publisher
    const mediumPublisher = new MediumPublisherService(mediumCredentials);

    // Publish to Medium
    const publishingResult = await mediumPublisher.publishToMedium(
      blog,
      publishingOptions
    );

    if (!publishingResult.success) {
      console.error('❌ Medium publishing failed:', publishingResult.error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Medium publishing failed',
          details: publishingResult.error
        },
        { status: 500 }
      );
    }

    console.log('✅ Medium publishing completed successfully');

    return NextResponse.json({
      success: true,
      data: publishingResult
    });

  } catch (error) {
    console.error('❌ Error in Medium publishing API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Medium publishing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Medium Publishing API',
    endpoints: {
      POST: '/api/publish-medium - Publish a generated blog to Medium',
    },
    requiredFields: {
      blog: 'GeneratedBlog - The generated blog object',
      publishingOptions: {
        tags: 'string[] - Array of tags for the Medium post',
        publishStatus: 'string - public | draft | unlisted',
        notifyFollowers: 'boolean - Whether to notify followers',
        license: 'string - License type for the content'
      }
    },
    notes: [
      'Requires valid Medium credentials in environment variables',
      'Uses Puppeteer for automated publishing',
      'May take 1-2 minutes to complete due to authentication process'
    ]
  });
} 