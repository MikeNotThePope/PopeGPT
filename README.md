# PopeGPT

A production-ready AI chat interface powered by Claude 3 Haiku via OpenRouter, built with Next.js 14, React, Flowbite, and Tailwind CSS.

## Features

- **Streaming Responses**: Real-time word-by-word AI responses with configurable speed
- **Message Editing**: Edit previous messages and regenerate responses with conversation branching
- **Retry Functionality**: Retry any message to regenerate responses
- **Smart Auto-Scroll**: Automatically scrolls to new messages, pauses during editing
- **Beautiful UI**: Modern, responsive interface using Flowbite components
- **Dark Mode**: Toggle between light and dark themes with theme-aware favicons
- **Customizable Branding**: Set your username to personalize the app name and favicon
- **Multiple Conversations**: Manage multiple chat threads with persistent titles
- **Markdown Support**: Full markdown rendering with syntax-highlighted code blocks
- **Copy Code**: One-click copy functionality for code snippets
- **Mobile Responsive**: Optimized for all screen sizes
- **Session-based**: No database required, conversations exist during browser session

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Components**: Flowbite React, Tailwind CSS
- **Markdown**: react-markdown, react-syntax-highlighter
- **AI**: Claude 3 Haiku via OpenRouter API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenRouter API key ([get one here](https://openrouter.ai))

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd PopeGPT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Add your OpenRouter API key to `.env`:
   ```
   OPENROUTER_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_USERNAME=Pope
   NEXT_PUBLIC_STREAMING_SPEED=50
   ```

   **Customization Options**:
   - `NEXT_PUBLIC_USERNAME`: Personalize the app name and favicon
     - Example: `Mike` → "MikeGPT" with "M" favicon
     - Example: `Sarah` → "SarahGPT" with "S" favicon
     - Appears in UI, page title, AI system prompt, and favicon
     - Favicon shows first letter (case-sensitive)
   - `NEXT_PUBLIC_STREAMING_SPEED`: Characters per second for typewriter effect (default: 50)
     - Recommended: 40-60 for ChatGPT-like feel
     - Fast: 80-120 for quick responses
     - Slow: 10-15 for classic typewriter effect

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Add environment variables:
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `NEXT_PUBLIC_USERNAME`: Your custom username (default: "Pope")
   - `NEXT_PUBLIC_STREAMING_SPEED`: Streaming speed in chars/sec (default: 50, optional)
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variables:
   ```bash
   vercel env add OPENROUTER_API_KEY
   vercel env add NEXT_PUBLIC_USERNAME
   vercel env add NEXT_PUBLIC_STREAMING_SPEED  # Optional, default: 50
   ```
   Enter your values when prompted.

5. Redeploy to apply environment variables:
   ```bash
   vercel --prod
   ```

## Project Structure

```
PopeGPT/
├── app/
│   ├── api/chat/         # Streaming API endpoint
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Home page
├── components/
│   ├── ChatInterface.tsx # Main chat component
│   ├── Message.tsx       # Message bubble with markdown
│   ├── MessageInput.tsx  # Input field with auto-resize
│   ├── MessageList.tsx   # Message display area
│   ├── Sidebar.tsx       # Conversation threads sidebar
│   └── ThemeToggle.tsx   # Dark mode toggle
├── lib/
│   ├── ChatContext.tsx   # Chat state management
│   └── types.ts          # TypeScript interfaces
└── public/               # Static assets
```

## Cost Optimization

This app uses Claude 3 Haiku, which is highly cost-effective:
- ~$0.25 per million input tokens
- ~$1.25 per million output tokens

Perfect for portfolio demos with a $10/month budget, supporting thousands of conversations.

## License

This project is licensed under [CC0 1.0 Universal](LICENSE) - it is dedicated to the public domain. You can copy, modify, distribute and use the work, even for commercial purposes, all without asking permission.

## Author

Built as a portfolio project showcasing modern web development with AI integration.
