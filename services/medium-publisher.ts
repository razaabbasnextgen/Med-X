import puppeteer, { Page, Browser } from 'puppeteer';
import { GeneratedBlog, MediumPublishingOptions, PublishingResult } from '@/types/blog';

export class MediumPublisherService {
  private email: string;
  private emailPassword: string;
  private mediumUsername: string;
  private browser?: Browser;
  
  constructor(credentials?: { email: string; emailPassword: string; mediumUsername: string }) {
    if (credentials) {
      this.email = credentials.email;
      this.emailPassword = credentials.emailPassword;
      this.mediumUsername = credentials.mediumUsername;
      console.log('🔑 MediumPublisher using provided credentials:', {
        email: this.email,
        mediumUsername: this.mediumUsername,
        source: 'user-provided'
      });
    } else {
      // Fallback to environment variables
      this.email = process.env.EMAIL || '';
      this.emailPassword = process.env.EMAIL_PASSWORD || '';
      this.mediumUsername = process.env.MEDIUM_USER_NAME || '';
      console.log('🔑 MediumPublisher using environment credentials:', {
        email: this.email,
        mediumUsername: this.mediumUsername,
        source: 'environment-variables'
      });
    }
    
    if (!this.email || !this.emailPassword || !this.mediumUsername) {
      throw new Error('Missing required credentials: email, emailPassword, mediumUsername');
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async authenticateGmail(gmailPage: Page): Promise<void> {
    try {
      console.log('🌐 Opening Gmail tab...');
      
      // Go to Gmail with longer timeout
      await gmailPage.goto('https://mail.google.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      await this.wait(3000); // Reduced from 5000
      
      console.log('📧 Gmail tab opened successfully!');
      console.log('📝 Please sign in to Gmail in the browser if needed, then return to this console.');
      console.log('⏳ Waiting 15 seconds for you to complete Gmail login...'); // Reduced from 30
      
      // Reduced wait time - no complex checking that causes context issues
      await this.wait(15000); // Reduced from 30000
      
      console.log('✅ Gmail setup complete - continuing with Medium automation...');
      
    } catch (error) {
      console.error('❌ Error opening Gmail:', error);
      console.log('⚠️ Gmail tab failed to open, but continuing anyway...');
      console.log('📝 Please manually open Gmail in another tab if needed.');
    }
  }

  private async waitForMediumAuthentication(mediumPage: Page): Promise<void> {
    try {
      // Wait for manual email link click with periodic checks
      const maxWaitTime = 30000; // 30 seconds
      const checkInterval = 3000; // Check every 3 seconds
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        await this.wait(checkInterval);
        
        try {
          // Check if we're now authenticated (not on signin page)
          const currentUrl = mediumPage.url();
          
          if (!currentUrl.includes('/signin') && !currentUrl.includes('/m/signin')) {
            console.log('✅ Medium authentication successful!');
            return;
          }
          
          // Also check page content for authentication signs
          const isAuthenticated = await mediumPage.evaluate(() => {
            try {
              // Check for authenticated user indicators
              return !!(
                document.querySelector('[data-testid="user-menu"]') ||
                document.querySelector('button[aria-label*="user"]') ||
                document.querySelector('a[href*="/me/"]') ||
                document.querySelector('.avatar') ||
                window.location.href.includes('medium.com') && 
                !window.location.href.includes('signin') &&
                !window.location.href.includes('login')
              );
            } catch (e) {
              return false;
            }
          });
          
          if (isAuthenticated) {
            console.log('✅ Medium authentication detected!');
            return;
          }
          
        } catch (error) {
          // Page context issues - just continue waiting
          console.log('⚠️ Checking authentication status...');
        }
      }
      
      console.log('⚠️ Authentication timeout reached, but continuing anyway...');
      console.log('📝 If you clicked the email link, the automation should continue normally.');
      
    } catch (error) {
      console.error('❌ Error waiting for authentication:', error);
      console.log('⚠️ Continuing anyway - please ensure you clicked the email link.');
    }
  }

  private async getSignInLinkFromGmail(gmailPage: Page): Promise<string | null> {
    try {
      console.log('📧 Automatically finding Medium sign-in link in Gmail...');
      
      // Wait for email to arrive (Medium emails usually arrive within 10-15 seconds)
      console.log('⏳ Waiting 15 seconds for Medium email to arrive...');
      await this.wait(15000);
      
      // Refresh Gmail to get the latest emails
      console.log('🔄 Refreshing Gmail to load new emails...');
      await gmailPage.reload({ waitUntil: 'domcontentloaded' });
      await this.wait(5000);
      
      // Strategy 1: Search for Medium emails directly
      try {
        console.log('🔍 Strategy 1: Searching for Medium emails...');
        
        // Click search box and search for Medium
        const searchBoxSelectors = [
          'input[aria-label="Search mail"]',
          'input[placeholder*="Search"]',
          '.gb_ef input',
          'input[name="q"]'
        ];
        
        for (const selector of searchBoxSelectors) {
          try {
            await gmailPage.waitForSelector(selector, { timeout: 3000 });
            await gmailPage.click(selector);
            await gmailPage.keyboard.down('Control');
            await gmailPage.keyboard.press('a');
            await gmailPage.keyboard.up('Control');
            await gmailPage.type(selector, 'from:noreply@medium.com subject:"Sign in"', { delay: 100 });
            await gmailPage.keyboard.press('Enter');
            await this.wait(4000);
            break;
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        console.log('⚠️ Search method failed, trying direct scan...');
      }
      
      // Strategy 2: Scan inbox for Medium emails
      console.log('📬 Strategy 2: Scanning inbox for Medium emails...');
      
      let attempts = 0;
      let signInLink = null;
      
      while (attempts < 3 && !signInLink) {
        attempts++;
        console.log(`🔍 Attempt ${attempts}: Looking for Medium email...`);
        
        signInLink = await gmailPage.evaluate(() => {
          try {
            // Find email rows/elements
            const emailSelectors = [
              'tr[class*="zA"]',
              '[data-thread-id]',
              '.yW',
              'div[role="main"] tr',
              '.zA'
            ];
            
            let emailElements: Element[] = [];
            for (const selector of emailSelectors) {
              const elements = Array.from(document.querySelectorAll(selector));
              if (elements.length > 0) {
                emailElements = elements;
                break;
              }
            }
            
            console.log(`Found ${emailElements.length} email elements`);
            
            // Look through recent emails (first 20)
            for (let i = 0; i < Math.min(emailElements.length, 20); i++) {
              const emailElement = emailElements[i];
              const emailText = emailElement.textContent?.toLowerCase() || '';
              const emailHtml = emailElement.innerHTML?.toLowerCase() || '';
              
              // Check if this looks like a Medium sign-in email
              const isMediumEmail = 
                emailText.includes('medium') ||
                emailText.includes('noreply@medium.com') ||
                emailHtml.includes('medium.com') ||
                emailText.includes('sign in to medium') ||
                emailText.includes('verify your email');
              
              if (isMediumEmail) {
                console.log('Found potential Medium email, opening...');
                
                // Click to open the email
                (emailElement as HTMLElement).click();
                
                                 // Wait a moment for email content to load
                 return new Promise<string | null>(resolve => {
                   setTimeout(() => {
                    // Look for sign-in links in the opened email
                    const allLinks = Array.from(document.querySelectorAll('a'));
                    
                    for (const link of allLinks) {
                      const href = link.getAttribute('href') || '';
                      const linkText = link.textContent?.toLowerCase() || '';
                      
                      // Check if this is a Medium sign-in link
                      if (
                        href.includes('medium.com') && 
                        (
                          href.includes('signin') || 
                          href.includes('sign-in') || 
                          href.includes('verify') || 
                          href.includes('confirm') ||
                          href.includes('auth') ||
                          href.includes('login')
                        ) &&
                        (
                          linkText.includes('sign in') ||
                          linkText.includes('verify') ||
                          linkText.includes('confirm') ||
                          linkText.includes('continue') ||
                          linkText.includes('access')
                        )
                      ) {
                        console.log('✅ Found Medium sign-in link:', href);
                        resolve(href);
                        return;
                      }
                    }
                    
                    // If no specific auth link found, try any Medium link in the email
                    for (const link of allLinks) {
                      const href = link.getAttribute('href') || '';
                      if (href.includes('medium.com') && href.length > 20) {
                        console.log('✅ Found Medium link (fallback):', href);
                        resolve(href);
                        return;
                      }
                    }
                    
                    resolve(null);
                  }, 3000); // Wait 3 seconds for email to fully load
                });
              }
            }
            
            return null;
          } catch (error) {
            console.error('Error in email scanning:', error);
            return null;
          }
        });
        
        if (signInLink) {
          break;
        }
        
        // Wait before next attempt
        if (attempts < 3) {
          console.log('⏳ Waiting before next attempt...');
          await this.wait(5000);
          
          // Refresh Gmail for next attempt
          await gmailPage.reload({ waitUntil: 'domcontentloaded' });
          await this.wait(3000);
        }
      }
      
      if (signInLink) {
        console.log('✅ Successfully found Medium sign-in link automatically!');
        return signInLink;
      }
      
      // Strategy 3: Fallback - try to find any recent Medium link
      console.log('🔄 Strategy 3: Looking for any Medium links...');
      
      const fallbackLink = await gmailPage.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a[href*="medium.com"]'));
        
        // Return the first Medium link that looks like it might be auth-related
        for (const link of allLinks) {
          const href = link.getAttribute('href') || '';
          if (href.includes('medium.com') && href.length > 20) {
            return href;
          }
        }
        
        return null;
      });
      
      if (fallbackLink) {
        console.log('✅ Found Medium link via fallback method!');
        return fallbackLink;
      }
      
      console.log('❌ Could not find any Medium sign-in link automatically');
      return null;
      
    } catch (error) {
      console.error('❌ Error in automated Gmail link extraction:', error);
      return null;
    }
  }

  private async findMediumEmail(gmailPage: Page): Promise<boolean> {
    try {
      // Wait for emails to load
      await gmailPage.waitForSelector('tr[class*="zA"]', { timeout: 10000 });
      
      // Look for Medium email in the inbox
      const mediumEmailFound = await gmailPage.evaluate(() => {
        const emailRows = document.querySelectorAll('tr[class*="zA"]');
        
        for (let i = 0; i < Math.min(emailRows.length, 10); i++) {
          const emailRow = emailRows[i];
          const text = emailRow.textContent?.toLowerCase() || '';
          
          if (text.includes('medium') || text.includes('noreply@medium.com') || 
              text.includes('sign in to medium')) {
            (emailRow as HTMLElement).click();
            return true;
          }
        }
        return false;
      });
      
      if (mediumEmailFound) {
        await this.wait(3000); // Wait for email to open
        console.log('✅ Found and opened Medium email');
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('⚠️ Error finding Medium email in inbox:', error);
      return false;
    }
  }

  private async searchMediumEmails(gmailPage: Page): Promise<void> {
    try {
      // Click search box
      await gmailPage.click('input[aria-label="Search mail"]');
      await gmailPage.type('input[aria-label="Search mail"]', 'from:noreply@medium.com');
      await gmailPage.keyboard.press('Enter');
      
      // Wait for search results
      await this.wait(3000);
      
      // Click first result
      await gmailPage.waitForSelector('tr[class*="zA"]', { timeout: 5000 });
      await gmailPage.click('tr[class*="zA"]:first-child');
      
      // Wait for email to open
      await this.wait(3000);
      
      console.log('✅ Opened Medium email from search');
      
    } catch (error) {
      console.log('⚠️ Error searching for Medium emails:', error);
    }
  }

  private async debugScreenshot(page: Page, filename: string): Promise<void> {
    try {
      await page.screenshot({ path: `debug-${filename}.png`, fullPage: true });
      console.log(`📸 Debug screenshot saved: debug-${filename}.png`);
    } catch (error) {
      console.log('⚠️ Could not take screenshot:', error);
    }
  }

  private async checkMediumAuthStatus(page: Page): Promise<boolean> {
    try {
      console.log('🔍 Checking for Medium authentication indicators...');
      
      // Wait for page to load
      await this.wait(2000);
      
      // Check for indicators that user is logged in
      const authStatus = await page.evaluate(() => {
                 // Check for write button (strongest indicator)
         const writeButton = document.querySelector('a[href="/new-story"]') || 
                            document.querySelector('a[href*="new-story"]') ||
                            document.querySelector('[data-testid="writeButton"]') ||
                            Array.from(document.querySelectorAll('a')).find(el => 
                              el.textContent?.toLowerCase().trim() === 'write' && 
                              el.getAttribute('href')?.includes('new-story')
                            ) ||
                            Array.from(document.querySelectorAll('a')).find(el => 
                              el.textContent?.toLowerCase().trim() === 'write'
                            );
        
        // Check for user profile/avatar elements
        const userElements = document.querySelector('[data-testid="user-menu"]') ||
                           document.querySelector('button[aria-label*="user"]') ||
                           document.querySelector('a[href*="/me/"]') ||
                           document.querySelector('.avatar') ||
                           document.querySelector('[aria-label*="profile"]');
        
        // Check for "Become a member" text (indicates not logged in)
        const memberText = Array.from(document.querySelectorAll('*')).some(el => 
          el.textContent?.includes('Become a member')
        );
        
        // Check URL
        const currentUrl = window.location.href;
        const isOnAuthPage = currentUrl.includes('signin') || 
                           currentUrl.includes('login') ||
                           currentUrl.includes('auth');
        
        // Check page title and content
        const pageTitle = document.title;
        const hasSignInContent = document.body.textContent?.includes('Sign in') ||
                               document.body.textContent?.includes('Sign up');
        
        return {
          writeButton: !!writeButton,
          userElements: !!userElements,
          memberText: memberText,
          isOnAuthPage: isOnAuthPage,
          currentUrl: currentUrl,
          pageTitle: pageTitle,
          hasSignInContent: hasSignInContent
        };
      });
      
      console.log('📊 Auth status check:', authStatus);
      
             // Determine if logged in based on multiple factors
       // If we have write button or user elements, we're logged in regardless of member text
       const isLoggedIn = (authStatus.writeButton || authStatus.userElements) && 
                         !authStatus.isOnAuthPage;
      
      console.log(`🔐 Authentication status: ${isLoggedIn ? 'LOGGED IN' : 'NOT LOGGED IN'}`);
      
      return isLoggedIn;
      
    } catch (error) {
      console.log('⚠️ Error checking Medium auth status:', error);
      return false; // Assume not logged in if we can't check
    }
  }

  async publishToMedium(
    blog: GeneratedBlog, 
    options: MediumPublishingOptions
  ): Promise<PublishingResult> {
    this.browser = await puppeteer.launch({ 
      headless: false, // Set to false for debugging
      defaultViewport: null,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use actual Chrome
      userDataDir: './chrome-automation-profile', // Separate profile for automation
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ],
      slowMo: 50 // Reduced slowMo for better performance
    });

    let gmailPage: Page | null = null;
    let mediumPage: Page | null = null;

    try {
      console.log('🚀 Starting fully automated Medium publishing process...');
      
      // Step 1: First authenticate with Gmail
      console.log('📧 Step 1: Logging into Gmail...');
      gmailPage = await this.browser.newPage();
      await this.authenticateGmail(gmailPage);
      
      // Step 2: Open Medium in a new tab
      console.log('🌐 Step 2: Opening Medium in new tab...');
      mediumPage = await this.browser.newPage();
      await mediumPage.goto('https://medium.com', { waitUntil: 'networkidle0' });
      
      // Debug: Take screenshot of current page
      await this.debugScreenshot(mediumPage, 'medium-signin-page');
      
            // Step 3: Check if already logged in, if not request email sign-in
      console.log('🔍 Step 3: Checking Medium authentication status...');
      await this.wait(3000); // Wait for page to fully load
      
      const isAlreadyLoggedIn = await this.checkMediumAuthStatus(mediumPage);
      
      if (isAlreadyLoggedIn) {
        console.log('✅ Already logged into Medium! Skipping authentication...');
        console.log('🚀 Going directly to write page...');
      } else {
        console.log('📨 Not logged in, requesting email sign-in from Medium...');
        
        try {
          await mediumPage.goto('https://medium.com/m/signin', { waitUntil: 'networkidle0' });
          await this.handleSignInPage(mediumPage);
          
          // Step 4: Automatically find and click the email link
          console.log('🔗 Step 4: Automatically finding and clicking sign-in link...');
          const signInLink = await this.getSignInLinkFromGmail(gmailPage);
          
          if (!signInLink) {
            throw new Error('Could not retrieve sign-in link from Gmail');
          }
          
          // Step 5: Use the sign-in link to authenticate Medium
          console.log('🔐 Step 5: Authenticating Medium with email link...');
          await mediumPage.goto(signInLink, { waitUntil: 'networkidle0' });
          await this.wait(3000);
          
        } catch (error) {
          console.log('⚠️ Authentication failed, but checking if we can proceed anyway...');
          
          // Double-check if we're actually logged in now
          const recheckAuth = await this.checkMediumAuthStatus(mediumPage);
          if (!recheckAuth) {
            throw error; // Re-throw if still not authenticated
          }
          console.log('✅ Found that we are actually logged in, continuing...');
        }
      }
      
      // Step 6: Navigate to write page
      console.log('✍️ Step 6: Navigating to write page...');
      await this.navigateToWritePage(mediumPage);
      
      // Step 7: Create the blog post
      console.log('📝 Step 7: Creating blog post...');
      
      // Debug: Log current page state before creating blog post
      const currentPageInfo = await mediumPage.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        editableElements: document.querySelectorAll('[contenteditable="true"]').length,
        textareas: document.querySelectorAll('textarea').length
      }));
      console.log('🔍 Page state before creating blog post:', currentPageInfo);
      
      const mediumUrl = await this.createBlogPost(mediumPage, blog, options);
      
      console.log('✅ Blog published successfully!');
      
      return {
        success: true,
        mediumUrl,
        publishedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error publishing to Medium:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      if (gmailPage) await gmailPage.close();
      if (mediumPage) await mediumPage.close();
      await this.browser.close();
    }
  }

  private async handleSignInPage(page: Page): Promise<void> {
    try {
      console.log('🔍 Analyzing Medium sign-in page...');
      
      // Wait for page to load
      await this.wait(3000);
      
      // First, let's see what's actually on the page
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          hasEmailInput: !!document.querySelector('input[type="email"]'),
          buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()),
          links: Array.from(document.querySelectorAll('a')).map(link => link.textContent?.trim()).slice(0, 10)
        };
      });
      
      console.log('📄 Page analysis:', pageContent);
      
      // Check if we're already on an email input page
      if (pageContent.hasEmailInput) {
        console.log('✅ Found email input, proceeding with email entry...');
        await this.enterEmailAndRequestSignIn(page);
        return;
      }
      
      // Look for sign-in options with updated selectors
      const signInSelectors = [
        'button::-p-text(Sign in)',
        'button::-p-text(Sign up)',
        'a::-p-text(Sign in)',
        'a::-p-text(Sign up)',
        '[data-testid*="sign"]',
        'button[data-action="signin"]',
        'button[data-action="sign-in"]'
      ];
      
      let clicked = false;
      for (const selector of signInSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          console.log(`✅ Clicked sign-in with selector: ${selector}`);
          clicked = true;
          await this.wait(2000);
          break;
        } catch (e) {
          console.log(`❌ Selector ${selector} not found, trying next...`);
          continue;
        }
      }
      
      if (!clicked) {
        // Try clicking the first button/link that contains "sign"
        const genericSignInClicked = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('button, a'));
          const signElement = elements.find(el => 
            el.textContent?.toLowerCase().includes('sign') ||
            el.getAttribute('href')?.includes('signin') ||
            el.getAttribute('href')?.includes('sign-in')
          );
          if (signElement) {
            (signElement as HTMLElement).click();
            return true;
          }
          return false;
        });
        
        if (genericSignInClicked) {
          console.log('✅ Clicked generic sign-in element');
          await this.wait(2000);
        }
      }
      
      // Take another screenshot after clicking
      await this.debugScreenshot(page, 'after-signin-click');
      
      // Check if we need to enter email or if we can proceed differently
      const currentPageInfo = await page.evaluate(() => ({
        url: window.location.href,
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        title: document.title
      }));
      
      console.log('📊 After sign-in click, page info:', currentPageInfo);
      
      if (currentPageInfo.hasEmailInput) {
        await this.enterEmailAndRequestSignIn(page);
      } else {
        console.log('⚠️ No email input found. Trying alternative Medium authentication...');
        // Alternative: try direct Medium OAuth or other auth methods
        await this.tryAlternativeAuth(page);
      }
      
    } catch (error) {
      console.error('Error handling sign-in page:', error);
      throw new Error('Could not handle Medium sign-in page');
    }
  }

  private async tryAlternativeAuth(page: Page): Promise<void> {
    try {
      console.log('🔄 Attempting alternative authentication...');
      
      // Option 1: Check if we can skip email entirely and go directly to the write page
      const isAlreadySignedIn = await page.evaluate(() => {
        return window.location.href.includes('medium.com') && 
               !window.location.href.includes('signin') &&
               !window.location.href.includes('login');
      });
      
      if (isAlreadySignedIn) {
        console.log('✅ Appears to be already signed in');
        return;
      }
      
      // Option 2: Look for alternative sign-in methods (Google, Facebook, etc.)
      const socialButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        return buttons.map(btn => ({
          text: btn.textContent?.trim(),
          href: btn.getAttribute('href'),
          hasGoogleIcon: btn.innerHTML.includes('google') || btn.textContent?.toLowerCase().includes('google'),
          hasFacebookIcon: btn.innerHTML.includes('facebook') || btn.textContent?.toLowerCase().includes('facebook')
        })).filter(btn => 
          btn.hasGoogleIcon || 
          btn.hasFacebookIcon || 
          btn.text?.toLowerCase().includes('continue with') ||
          btn.href?.includes('oauth')
        );
      });
      
      console.log('🔍 Found social login options:', socialButtons);
      
      // Option 3: Try to navigate directly to Medium if all else fails
      console.log('⚠️ No viable authentication found, attempting to skip...');
      await page.goto('https://medium.com', { waitUntil: 'networkidle0' });
      
    } catch (error) {
      console.error('Alternative auth failed:', error);
      throw new Error('All authentication methods failed');
    }
  }

  private async clickSignInWithEmail(page: Page): Promise<void> {
    try {
      console.log('🔍 Looking for email sign-in button...');
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try multiple selectors for email sign-in
      const emailButtonSelectors = [
        'button[data-testid="emailSignInButton"]',
        'button[data-testid="sign-in-with-email"]',
        'button::-p-text(Sign in with email)',
        'button::-p-text(Continue with email)',
        'a[href*="signin?email"]',
        'button::-p-text(Email)'
      ];
      
      let clicked = false;
      for (const selector of emailButtonSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          console.log(`✅ Clicked email sign-in button with selector: ${selector}`);
          clicked = true;
          break;
        } catch (e) {
          console.log(`❌ Selector ${selector} not found, trying next...`);
          continue;
        }
      }
      
      if (!clicked) {
        // Last resort: try to find any button with email-related text
        console.log('🔄 Trying alternative method to find email sign-in...');
        await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('button, a'));
          const emailElement = elements.find(el => 
            el.textContent?.toLowerCase().includes('email') ||
            el.textContent?.toLowerCase().includes('continue') ||
            el.getAttribute('aria-label')?.toLowerCase().includes('email')
          );
          if (emailElement) {
            (emailElement as HTMLElement).click();
          }
        });
      }
      
      await this.wait(2000);
      
    } catch (error) {
      console.error('Error clicking email sign-in:', error);
      throw new Error('Could not find email sign-in option');
    }
  }

  private async enterEmailAndRequestSignIn(page: Page): Promise<void> {
    try {
      console.log('📧 Looking for email input field...');
      
      // Take screenshot before attempting email entry
      await this.debugScreenshot(page, 'before-email-entry');
      
      // Check what's currently on the page
      const pageInfo = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        emailInputs: Array.from(document.querySelectorAll('input[type="email"]')).length,
        allInputs: Array.from(document.querySelectorAll('input')).map(inp => ({ 
          type: inp.type, 
          placeholder: inp.placeholder,
          name: inp.name 
        }))
      }));
      
      console.log('📄 Current page info:', pageInfo);
      
      // Try multiple email input selectors
      const emailSelectors = [
        'input[type="email"]',
        'input[placeholder*="email"]',
        'input[name*="email"]',
        'input[id*="email"]',
        'input[data-testid*="email"]'
      ];
      
      let emailInput = null;
      for (const selector of emailSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          emailInput = selector;
          console.log(`✅ Found email input with selector: ${selector}`);
          break;
        } catch (e) {
          console.log(`❌ Email selector ${selector} not found, trying next...`);
          continue;
        }
      }
      
      if (!emailInput) {
        throw new Error('No email input field found on the page');
      }
      
      // Clear and enter email
      await page.click(emailInput);
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.type(emailInput, this.email);
      
      console.log(`✅ Entered email: ${this.email}`);
      
      // Click continue/submit button
      const submitSelectors = [
        'button[type="submit"]',
        'button::-p-text(Continue)',
        'button::-p-text(Sign in)',
        'button::-p-text(Send)',
        'button::-p-text(Next)'
      ];
      
      let clicked = false;
      for (const selector of submitSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          console.log(`✅ Clicked submit button with selector: ${selector}`);
          clicked = true;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!clicked) {
        // Try to press Enter
        await page.keyboard.press('Enter');
        console.log('✅ Pressed Enter to submit');
      }
      
      // Wait for confirmation that email was sent
      await this.wait(3000);
      console.log('📧 Email sign-in request sent, checking Gmail...');
      
    } catch (error) {
      console.error('Error entering email:', error);
      throw new Error('Could not enter email or submit form');
    }
  }

  private async navigateToWritePage(page: Page): Promise<void> {
    try {
      console.log('🔄 Navigating to Medium write page...');
      
      // Try multiple approaches to get to the write page
      const writeUrls = [
        'https://medium.com/new-story',
        'https://medium.com/m/new-story',
        'https://medium.com/new',
        'https://medium.com/write'
      ];
      
      let navigated = false;
      
      for (const writeUrl of writeUrls) {
        try {
          console.log(`🔗 Trying URL: ${writeUrl}`);
          await page.goto(writeUrl, { waitUntil: 'networkidle0', timeout: 15000 });
          
          // Wait for editor to load
          await this.wait(3000);
          
          // Check if we're on a write page
          const pageInfo = await page.evaluate(() => ({
            url: window.location.href,
            title: document.title,
            hasEditableElements: document.querySelectorAll('[contenteditable="true"]').length > 0,
            hasTextareas: document.querySelectorAll('textarea').length > 0
          }));
          
          console.log('📄 Page info after navigation:', pageInfo);
          
          if (pageInfo.hasEditableElements || pageInfo.hasTextareas || 
              pageInfo.url.includes('new-story') || pageInfo.url.includes('write')) {
            console.log('✅ Successfully navigated to write page');
            navigated = true;
            break;
          }
          
        } catch (e) {
          console.log(`❌ Failed to navigate to ${writeUrl}, trying next...`);
          continue;
        }
      }
      
      if (!navigated) {
        // Try to find and click write button from current page
        console.log('🔍 Trying to find write button on current page...');
        
        const writeSelectors = [
          'a[href="/new-story"]',
          'a[href="/m/new-story"]',
          'button::-p-text(Write)',
          'a::-p-text(Write)',
          '[data-testid="writeButton"]',
          'a[aria-label*="Write"]',
          'button[aria-label*="Write"]'
        ];
        
        for (const selector of writeSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 3000 });
            await page.click(selector);
            console.log(`✅ Clicked write button: ${selector}`);
            await this.wait(3000);
            navigated = true;
            break;
          } catch (e) {
            console.log(`❌ Write button ${selector} not found, trying next...`);
            continue;
          }
        }
      }
      
      if (!navigated) {
        throw new Error('Could not navigate to Medium write page');
      }
      
    } catch (error) {
      console.error('Error navigating to write page:', error);
      throw new Error('Could not navigate to Medium write page');
    }
  }

  private async createBlogPost(
    page: Page, 
    blog: GeneratedBlog, 
    options: MediumPublishingOptions
  ): Promise<string> {
    try {
      console.log('✏️ Setting up blog post...');
      
      // Wait for page to load and editor to be ready
      await this.wait(5000);
      
      // Try multiple selectors for the Medium editor
      const editorSelectors = [
        'div[role="article"]',
        'div[data-testid="editor"]',
        'div[class*="editor"]',
        'div[aria-label*="editor"]',
        'div[contenteditable="true"]',
        'section[data-field="body"]',
        'div[data-contents="true"]'
      ];
      
      let editorFound = false;
      for (const selector of editorSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          console.log(`✅ Found editor with selector: ${selector}`);
          editorFound = true;
          break;
        } catch (e) {
          console.log(`❌ Editor selector ${selector} not found, trying next...`);
          continue;
        }
      }
      
      if (!editorFound) {
        console.log('⚠️ No editor found with standard selectors, checking page content...');
        const pageInfo = await page.evaluate(() => ({
          url: window.location.href,
          title: document.title,
          hasEditableElements: document.querySelectorAll('[contenteditable="true"]').length,
          hasTextareas: document.querySelectorAll('textarea').length
        }));
        console.log('📄 Page info:', pageInfo);
        
        // If we're not on the write page, try to navigate there
        if (!pageInfo.url.includes('/new-story') && !pageInfo.url.includes('write')) {
          console.log('🔄 Not on write page, attempting to navigate...');
          await this.navigateToWritePage(page);
          await this.wait(3000);
        }
      }
      
      // Find title input
      const titleSelectors = [
        'textarea[data-testid="title-input"]',
        'textarea[placeholder*="Title"]',
        'textarea[placeholder*="title"]',
        'div[data-testid="title"] textarea',
        'h1[data-testid="title"]',
        'div[role="textbox"][data-testid="title"]',
        'div[aria-label*="Title"]',
        'div[aria-label*="title"]',
        'textarea.graf--title',
        'textarea.graf--titleEditor',
        '[contenteditable="true"][data-testid*="title"]',
        'div[contenteditable="true"]:first-of-type',
        'h1[contenteditable="true"]',
        'div[aria-label*="Post title"]',
        'div[placeholder*="Post title"]'
      ];
      
      let titleInput = null;
      for (const selector of titleSelectors) {
        try {
          const element = await page.waitForSelector(selector, { timeout: 3000, visible: true });
          if (element) {
            titleInput = selector;
            console.log(`✅ Found title input: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Title selector ${selector} not found, trying next...`);
          continue;
        }
      }
      
      if (!titleInput) {
        // Try to find any contenteditable element as fallback
        console.log('⚠️ Trying fallback method to find editable element...');
        const fallbackElement = await page.evaluate(() => {
          const editables = document.querySelectorAll('[contenteditable="true"]');
          if (editables.length > 0) {
            return true;
          }
          return false;
        });
        
        if (fallbackElement) {
          titleInput = '[contenteditable="true"]';
          console.log('✅ Using fallback contenteditable element for title');
        } else {
          throw new Error('Could not find title input field');
        }
      }
      
      // Clear and add title using COPY-PASTE METHOD
      console.log('📋 Adding title via copy-paste...');
      await page.click(titleInput);
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      
      // Copy title to clipboard and paste
      await page.evaluate((title) => {
        navigator.clipboard.writeText(title);
      }, blog.ontology.title);
      
      await this.wait(100); // Brief wait for clipboard
      
      await page.keyboard.down('Control');
      await page.keyboard.press('v');
      await page.keyboard.up('Control');
      
      console.log(`✅ Added title: ${blog.ontology.title}`);
      
      // Wait a bit for title to register
      await this.wait(500); // Reduced from 1000
      
      // Move to content area by pressing Enter
      await page.keyboard.press('Enter');
      await this.wait(300); // Reduced from 500
      
      // Add content - COPY-PASTE METHOD (instant)
      console.log('📋 Adding blog content via copy-paste...');
      const mediumContent = this.convertMarkdownToMediumFormat(blog.content);
      
      try {
        // Copy to clipboard and paste
        await page.evaluate((content) => {
          navigator.clipboard.writeText(content);
        }, mediumContent);
        
        await this.wait(100); // Brief wait for clipboard
        
        // Paste the content
        await page.keyboard.down('Control');
        await page.keyboard.press('v');
        await page.keyboard.up('Control');
        
        console.log('✅ Added blog content (copy-paste method)');
        
      } catch (error) {
        console.log('⚠️ Copy-paste failed, using fast typing fallback...');
        
        // Fast typing fallback - but still much faster than before
        await page.type('body', mediumContent, { delay: 1 });
        console.log('✅ Added blog content (fast typing method)');
      }
      
      // Wait for content to be processed
      await this.wait(1500); // Reduced from 2000
      
      // Publish the post
      await this.publishPost(page, options);
      
      // Get the published URL with better retrieval
      const publishedUrl = await this.getPublishedUrl(page);
      
      return publishedUrl;
      
    } catch (error) {
      console.error('Error creating blog post:', error);
      
      // Take debug screenshots for troubleshooting
      try {
        await this.debugScreenshot(page, 'error-page-state');
        
        // Log current page information for debugging
        const debugInfo = await page.evaluate(() => ({
          url: window.location.href,
          title: document.title,
          editableElements: document.querySelectorAll('[contenteditable="true"]').length,
          textareas: document.querySelectorAll('textarea').length,
          buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).slice(0, 10),
          inputs: Array.from(document.querySelectorAll('input')).map(input => ({
            type: input.type,
            placeholder: input.placeholder,
            name: input.name
          })).slice(0, 10)
        }));
        
        console.log('🔍 Debug page info:', JSON.stringify(debugInfo, null, 2));
        
      } catch (debugError) {
        console.error('Could not capture debug info:', debugError);
      }
      
      throw new Error(`Could not create blog post on Medium: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertMarkdownToMediumFormat(markdown: string): string {
    // Convert markdown to Medium-friendly format
    let content = markdown;
    
    // Remove markdown headers but keep the text
    content = content.replace(/^#{1,6}\s/gm, '');
    
    // Convert bold and italic
    content = content.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold for now
    content = content.replace(/\*(.*?)\*/g, '$1'); // Remove italic for now
    
    return content;
  }

  private async publishPost(page: Page, options: MediumPublishingOptions): Promise<void> {
    try {
      console.log('🚀 Publishing blog post...');
      
      // Look for publish button
      const publishSelectors = [
        'button::-p-text(Publish)',
        'button[data-testid="publish-button"]',
        'button::-p-text(Ready to publish?)',
        '[aria-label*="publish"]'
      ];
      
      let publishButton = null;
      for (const selector of publishSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          publishButton = selector;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!publishButton) {
        // Try keyboard shortcut
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');
        console.log('✅ Used keyboard shortcut to publish');
      } else {
        await page.click(publishButton);
        console.log('✅ Clicked publish button');
      }
      
      // Wait for publish dialog/confirmation
      await this.wait(3000);
      
      // Handle tags if provided
      if (options.tags && options.tags.length > 0) {
        console.log('🏷️ Adding tags...');
        
        // Look for tag input
        const tagSelectors = [
          'input[placeholder*="tag"]',
          'input[aria-label*="tag"]',
          '[data-testid="tag-input"]'
        ];
        
        let tagInput = null;
        for (const selector of tagSelectors) {
          try {
            tagInput = await page.$(selector);
            if (tagInput) break;
          } catch (e) {
            continue;
          }
        }
        
        if (tagInput) {
          for (const tag of options.tags.slice(0, 5)) { // Medium allows max 5 tags
            await page.type('input[placeholder*="tag"]', tag);
            await page.keyboard.press('Enter');
            await this.wait(500);
          }
          console.log(`✅ Added ${options.tags.length} tags`);
        }
      }
      
      // Final publish confirmation
      const finalPublishSelectors = [
        'button::-p-text(Publish now)',
        'button::-p-text(Publish)',
        'button[data-testid="confirm-publish"]'
      ];
      
      for (const selector of finalPublishSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          await page.click(selector);
          console.log('✅ Final publish confirmation clicked');
          break;
        } catch (e) {
          continue;
        }
      }
      
      // Alternative: use Enter key for final confirmation
        await page.keyboard.press('Enter');
      
      // Wait for publish to complete
      await this.wait(5000);
      console.log('✅ Blog post published!');
      
    } catch (error) {
      console.error('Error publishing post:', error);
      throw new Error('Could not publish blog post');
    }
  }

  private async getPublishedUrl(page: Page): Promise<string> {
    try {
      console.log('🔗 Getting published article URL...');
      
      // Wait for URL change or success message
      await this.wait(5000); // Wait for Medium to process
      
      // Try multiple methods to get the URL
      console.log('🔍 Method 1: Checking for share dialog...');
      
      // Look for share button and click it
      const shareSelectors = [
        'button[aria-label*="Share"]',
        'button::-p-text(Share)',
        '[data-testid="share-button"]',
        'button[title*="Share"]'
      ];
      
      for (const selector of shareSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          console.log('✅ Clicked share button');
          await this.wait(2000);
          break;
        } catch (e) {
          continue;
        }
      }
      
      // Look for URL input in share dialog
      console.log('🔍 Method 2: Looking for URL in share dialog...');
      const urlFromShare = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const urlInput = inputs.find(input => 
          input.value && 
          (input.value.includes('medium.com') || input.value.includes('/@'))
        );
        return urlInput?.value || null;
      });
      
      if (urlFromShare) {
        console.log('✅ Found URL from share dialog:', urlFromShare);
        return urlFromShare;
      }
      
      // Method 3: Check current URL
      console.log('🔍 Method 3: Checking current page URL...');
      const currentUrl = page.url();
      if (currentUrl.includes('medium.com') && currentUrl.includes('/@')) {
        console.log('✅ Using current page URL:', currentUrl);
        return currentUrl;
      }
      
      // Method 4: Look for links on the page
      console.log('🔍 Method 4: Looking for article links on page...');
      const articleUrl = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const articleLink = links.find(link => 
          link.href && 
          link.href.includes('medium.com') && 
          link.href.includes('/@') &&
          !link.href.includes('/edit')
        );
        return articleLink?.href || null;
      });
      
      if (articleUrl) {
        console.log('✅ Found article URL on page:', articleUrl);
        return articleUrl;
      }
      
      // Method 5: Try to navigate to profile and find latest post
      console.log('🔍 Method 5: Checking profile for latest post...');
      try {
        await page.goto(`https://medium.com/@${this.mediumUsername.replace('@', '')}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        await this.wait(3000);
        
        const latestPost = await page.evaluate(() => {
          const postLinks = Array.from(document.querySelectorAll('a'));
          const latestPostLink = postLinks.find(link => 
            link.href && 
            link.href.includes('medium.com') && 
            link.href.includes('/@') &&
            !link.href.includes('/edit') &&
            !link.href.includes('/responses')
          );
          return latestPostLink?.href || null;
        });
        
        if (latestPost) {
          console.log('✅ Found latest post URL from profile:', latestPost);
          return latestPost;
        }
      } catch (e) {
        console.log('⚠️ Could not check profile for latest post');
      }
      
      // Fallback: return current URL
      console.log('⚠️ Using fallback URL:', currentUrl);
      return currentUrl;
      
    } catch (error) {
      console.error('Error getting published URL:', error);
      const fallbackUrl = page.url();
      console.log('⚠️ Using fallback URL due to error:', fallbackUrl);
      return fallbackUrl;
    }
  }
} 
