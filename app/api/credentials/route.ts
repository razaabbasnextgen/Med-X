import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CREDENTIALS_FILE = path.join(process.cwd(), 'user-credentials.json');

interface UserCredentials {
  email: string;
  emailPassword: string;
  mediumUsername: string;
  googleApiKey?: string;
  savedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePassword = searchParams.get('includePassword') === 'true';
    
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
      const credentials = JSON.parse(data);
      
      if (includePassword) {
        // Return full credentials including password (for backend use)
        return NextResponse.json({
          hasCredentials: true,
          email: credentials.email,
          emailPassword: credentials.emailPassword,
          mediumUsername: credentials.mediumUsername,
          googleApiKey: credentials.googleApiKey,
          savedAt: credentials.savedAt
        });
      } else {
        // Return credentials without password for security (for frontend)
        return NextResponse.json({
          hasCredentials: true,
          email: credentials.email,
          mediumUsername: credentials.mediumUsername,
          hasGoogleApiKey: !!credentials.googleApiKey,
          savedAt: credentials.savedAt
        });
      }
    }
    
    return NextResponse.json({ hasCredentials: false });
  } catch (error) {
    console.error('Error reading credentials:', error);
    return NextResponse.json({ hasCredentials: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, emailPassword, mediumUsername, googleApiKey, save } = body;
    
    if (!email || !emailPassword || !mediumUsername) {
      return NextResponse.json(
        { error: 'Email, password, and Medium username are required' },
        { status: 400 }
      );
    }
    
    const credentials: UserCredentials = {
      email,
      emailPassword,
      mediumUsername,
      googleApiKey,
      savedAt: new Date().toISOString()
    };
    
    // Save credentials if requested
    if (save) {
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
      console.log('✅ Credentials saved to local file');
    }
    
    return NextResponse.json({ 
      success: true, 
      saved: save,
      message: save ? 'Credentials saved successfully' : 'Credentials received (not saved)'
    });
    
  } catch (error) {
    console.error('Error saving credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
      console.log('✅ Credentials deleted');
    }
    
    return NextResponse.json({ success: true, message: 'Credentials deleted' });
  } catch (error) {
    console.error('Error deleting credentials:', error);
    return NextResponse.json(
      { error: 'Failed to delete credentials' },
      { status: 500 }
    );
  }
} 