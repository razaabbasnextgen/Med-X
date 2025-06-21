# Med-X AI Blog Generator

An intelligent blog generation and publishing platform that automatically creates high-quality, research-backed blog posts and publishes them directly to Medium.

## 🚀 Features

- **AI-Powered Content Generation**: Leverages advanced AI to create comprehensive blog posts
- **Automated Research**: Gathers information from news articles and YouTube videos
- **SEO Optimization**: Generates meta descriptions, keywords, and hashtags
- **One-Click Publishing**: Automatically publishes to Medium with authentication
- **Beautiful UI**: Modern, responsive interface built with Next.js and Tailwind CSS
- **Credential Management**: Secure handling of publishing credentials

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes
- **Automation**: Puppeteer for browser automation
- **AI Integration**: Google Custom Search API for research
- **Authentication**: Gmail & Medium integration

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/med-x-ai-blog-generator.git
   cd med-x-ai-blog-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_CSE_ID=your_custom_search_engine_id
   ```

4. **Install Chrome (Required for automation)**
   Make sure Google Chrome is installed at: `C:\Program Files\Google\Chrome\Application\chrome.exe`

## 🔧 Configuration

### Google API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Custom Search API
4. Create credentials (API Key)
5. Set up a Custom Search Engine at [Google CSE](https://cse.google.com/)

### Medium Publishing Setup
The application handles Medium authentication automatically through:
- Gmail integration for email-based sign-in
- Automated browser interaction with Medium's interface
- Secure credential storage during the session

## 🎯 Usage

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Enter your credentials**
   - Gmail email and password
   - Medium username
   - Google API key (optional for enhanced research)

4. **Generate a blog post**
   - Enter your blog topic
   - Select tone and target audience
   - Add keywords (optional)
   - Click "Generate Blog"

5. **Review and publish**
   - Review the generated content
   - Check SEO optimization
   - View research sources
   - Publish directly to Medium

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── generate/          # Blog generation page
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── blog-generator.tsx # Main blog generator component
│   └── ...
├── services/             # Business logic
│   ├── content-generator.ts
│   ├── medium-publisher.ts
│   └── research.ts
├── types/                # TypeScript type definitions
└── ...
```

## 🔑 Key Components

- **BlogGenerator**: Main UI component for blog creation
- **MediumPublisherService**: Handles automated Medium publishing
- **ContentGenerator**: AI-powered content creation
- **ResearchService**: Gathers information from various sources
- **CredentialManager**: Secure credential handling

## 🚨 Important Notes

- **Chrome Automation**: Uses Puppeteer with actual Chrome browser
- **Credential Security**: Credentials are handled securely and not stored permanently
- **Rate Limits**: Respects API rate limits and includes appropriate delays
- **Error Handling**: Comprehensive error handling with debug information

## 🐛 Troubleshooting

### Common Issues

1. **Chrome not found**: Ensure Chrome is installed in the default location
2. **Timeout errors**: Check internet connection and Medium's accessibility
3. **Authentication failures**: Verify Gmail credentials and Medium username
4. **API errors**: Check Google API key and Custom Search Engine setup

### Debug Mode
The application includes extensive logging and debug screenshots for troubleshooting.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational and legitimate content creation purposes. Users are responsible for:
- Complying with Medium's Terms of Service
- Ensuring content originality and quality
- Respecting rate limits and platform guidelines
- Securing their own credentials

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Automation powered by [Puppeteer](https://pptr.dev/)
- Research via [Google Custom Search API](https://developers.google.com/custom-search)

---

**Made with ❤️ for content creators and AI enthusiasts** 