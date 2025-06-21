'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Save, Eye, EyeOff } from 'lucide-react';

interface Credentials {
  email: string;
  emailPassword: string;
  mediumUsername: string;
  googleApiKey: string;
}

interface SavedCredentials {
  hasCredentials: boolean;
  email?: string;
  mediumUsername?: string;
  hasGoogleApiKey?: boolean;
  savedAt?: string;
}

interface CredentialManagerProps {
  onCredentialsReady: (credentials: Credentials) => void;
  onCredentialsChanged: (hasCredentials: boolean) => void;
}

export function CredentialManager({ onCredentialsReady, onCredentialsChanged }: CredentialManagerProps) {
  const [credentials, setCredentials] = useState<Credentials>({
    email: '',
    emailPassword: '',
    mediumUsername: '',
    googleApiKey: ''
  });
  
  const [savedCredentials, setSavedCredentials] = useState<SavedCredentials>({
    hasCredentials: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [useNewCredentials, setUseNewCredentials] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    console.log('🔧 CredentialManager: Component mounted, loading saved credentials...');
    loadSavedCredentials();
  }, []);

  // Debug: Log credentials state changes
  useEffect(() => {
    console.log('🔧 CredentialManager: Credentials state changed:', {
      email: credentials.email,
      mediumUsername: credentials.mediumUsername,
      hasPassword: !!credentials.emailPassword,
      hasGoogleApiKey: !!credentials.googleApiKey
    });
  }, [credentials]);

  // Auto-load saved credentials if available
  useEffect(() => {
    if (savedCredentials.hasCredentials && !credentials.email && !useNewCredentials) {
      console.log('🔄 Auto-loading saved credentials...');
      handleUseSavedCredentials();
    }
  }, [savedCredentials.hasCredentials]);

  const loadSavedCredentials = async () => {
    try {
      console.log('🔍 Loading saved credentials...');
      const response = await fetch('/api/credentials');
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Non-OK response:', response.status, text);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      
      const data = await response.json();
      console.log('✅ Credentials loaded:', data);
      setSavedCredentials(data);
      onCredentialsChanged(data.hasCredentials);
    } catch (error) {
      console.error('❌ Error loading credentials:', error);
    }
  };

  const handleInputChange = (field: keyof Credentials, value: string) => {
    const newCredentials = { ...credentials, [field]: value };
    setCredentials(newCredentials);
    
    // Debug: Log what's happening
    console.log('📝 CredentialManager: Input changed for field:', field, 'value:', value.substring(0, 3) + '***');
    console.log('📝 CredentialManager: Sending updated credentials to parent:', {
      email: newCredentials.email,
      mediumUsername: newCredentials.mediumUsername,
      hasPassword: !!newCredentials.emailPassword,
      hasGoogleApiKey: !!newCredentials.googleApiKey
    });

    // Always call onCredentialsReady with the latest state
    console.log('📝 CredentialManager: About to call onCredentialsReady...');
    onCredentialsReady(newCredentials);
    console.log('📝 CredentialManager: Called onCredentialsReady successfully');
    
    // Check if we have valid credentials for any operation
    const hasMediumCredentials = newCredentials.email && newCredentials.emailPassword && newCredentials.mediumUsername;
    const hasGoogleApiKey = newCredentials.googleApiKey;
    
    // Signal if we have complete credentials for at least one operation
    const hasValidCredentials = Boolean(hasMediumCredentials || hasGoogleApiKey);
    console.log('📝 CredentialManager: Credentials validation:', {
      hasMediumCredentials,
      hasGoogleApiKey,
      hasValidCredentials
    });
    
    onCredentialsChanged(hasValidCredentials);
  };

  const handleSaveCredentials = async () => {
    if (!credentials.email || !credentials.emailPassword || !credentials.mediumUsername) {
      setMessage('Please fill in required fields: email, password, and Medium username');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          save: saveCredentials
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(data.message);
        console.log('✅ CredentialManager: Calling onCredentialsReady with:', {
          email: credentials.email,
          mediumUsername: credentials.mediumUsername,
          hasPassword: !!credentials.emailPassword
        });
        onCredentialsReady(credentials);
        onCredentialsChanged(true); // Signal that we have valid credentials
        
        if (saveCredentials) {
          await loadSavedCredentials();
        }
      } else {
        setMessage(data.error || 'Failed to save credentials');
      }
    } catch (error) {
      setMessage('Error saving credentials');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSavedCredentials = async () => {
    try {
      // Load full credentials (with password) for use
      const response = await fetch('/api/credentials?includePassword=true');
      const data = await response.json();
      
      if (data.hasCredentials) {
        const savedCreds = {
          email: data.email,
          emailPassword: data.emailPassword,
          mediumUsername: data.mediumUsername,
          googleApiKey: data.googleApiKey || ''
        };
        
        setCredentials(savedCreds);
        console.log('💾 CredentialManager: Using saved credentials:', {
          email: savedCreds.email,
          mediumUsername: savedCreds.mediumUsername,
          hasPassword: !!savedCreds.emailPassword,
          hasGoogleApiKey: !!savedCreds.googleApiKey
        });
        onCredentialsReady(savedCreds);
        setMessage('✅ Using saved credentials');
      }
    } catch (error) {
      setMessage('Error loading saved credentials');
      console.error('Error:', error);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!confirm('Are you sure you want to delete saved credentials?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/credentials', {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Credentials deleted successfully');
        setSavedCredentials({ hasCredentials: false });
        setCredentials({ email: '', emailPassword: '', mediumUsername: '', googleApiKey: '' });
        onCredentialsChanged(false);
      } else {
        setMessage('Failed to delete credentials');
      }
    } catch (error) {
      setMessage('Error deleting credentials');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Medium Publishing Credentials</CardTitle>
        <CardDescription>
          Enter your credentials for automated Medium publishing and blog generation. You can save them securely on your machine.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Saved Credentials Section */}
        {savedCredentials.hasCredentials && !useNewCredentials && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Saved Credentials Found</h3>
            <p className="text-sm text-green-700 mb-3">
              Email: {savedCredentials.email}<br/>
              Medium Username: {savedCredentials.mediumUsername}<br/>
              Google API Key: {savedCredentials.hasGoogleApiKey ? '✅ Available' : '❌ Not set'}<br/>
              Saved: {savedCredentials.savedAt ? new Date(savedCredentials.savedAt).toLocaleString() : 'Unknown'}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleUseSavedCredentials}
                variant="outline" 
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                Use Saved Credentials
              </Button>
              <Button 
                onClick={() => setUseNewCredentials(true)}
                variant="outline" 
                size="sm"
              >
                Use New Credentials
              </Button>
              <Button 
                onClick={handleDeleteCredentials}
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Credential Input Form */}
        {(!savedCredentials.hasCredentials || useNewCredentials) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Gmail Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@gmail.com"
                value={credentials.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Gmail Password / App Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your Gmail password or app password"
                  value={credentials.emailPassword}
                  onChange={(e) => handleInputChange('emailPassword', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Medium Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="@yourusername"
                value={credentials.mediumUsername}
                onChange={(e) => handleInputChange('mediumUsername', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleApiKey">Google API Key (Gemini) <span className="text-xs text-gray-500">(Optional for publishing)</span></Label>
              <Input
                id="googleApiKey"
                type="password"
                placeholder="Your Google Gemini API key (required for blog generation)"
                value={credentials.googleApiKey}
                onChange={(e) => handleInputChange('googleApiKey', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>. Required for blog generation, optional for publishing existing blogs.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="save" 
                checked={saveCredentials}
                onCheckedChange={(checked) => setSaveCredentials(checked as boolean)}
              />
              <Label htmlFor="save" className="text-sm">
                Save credentials securely on this machine
              </Label>
            </div>

            <Button 
              onClick={handleSaveCredentials}
              disabled={isLoading || !credentials.email || !credentials.emailPassword || !credentials.mediumUsername}
              className="w-full"
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {saveCredentials ? 'Save & Use Credentials' : 'Use Credentials (Don\'t Save)'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Messages */}
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Security Note */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Security Note:</strong> Credentials are stored locally on your machine in an encrypted format. 
          They are never sent to external servers except for the automation process.
        </div>
      </CardContent>
    </Card>
  );
} 