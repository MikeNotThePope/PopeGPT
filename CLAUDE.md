# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PopeGPT is a production-ready ChatGPT/Claude-style chat interface built with Next.js 14, React, TypeScript, Flowbite components, and Tailwind CSS. It uses Claude 3 Haiku via the OpenRouter API for cost-effective AI responses with streaming support.

**Note**: The app name is customizable via the `NEXT_PUBLIC_USERNAME` environment variable. By default it's "PopeGPT", but users can personalize it (e.g., "MikeGPT", "SarahGPT", etc.).

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI**: Flowbite React, Tailwind CSS
- **AI**: OpenRouter API (Claude 3 Haiku)
- **Markdown**: react-markdown, react-syntax-highlighter
- **Deployment**: Vercel

## Common Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Deployment
vercel               # Deploy to Vercel
vercel --prod        # Deploy to production
```

## Environment Configuration

- **API Key**: OpenRouter API key stored in `.env` as `OPENROUTER_API_KEY`
- **App Name**: Customizable username via `NEXT_PUBLIC_USERNAME` (default: "Pope")
  - Used to construct the app name as `{USERNAME}GPT`
  - Appears in UI header, page title, and AI system prompt
- **Template**: Copy `.env.example` to `.env` and add your configuration
- The `.env` file is gitignored and should never be committed

## Architecture

### State Management
- **ChatContext** (`lib/ChatContext.tsx`): React Context managing conversations, messages, and streaming state
- **Session-based**: All data stored in memory, cleared on page refresh
- **Auto-titles**: First user message becomes conversation title

### API Integration
- **Streaming Endpoint** (`app/api/chat/route.ts`): Edge function that streams responses from OpenRouter
- **Model**: Uses `anthropic/claude-3-haiku` for cost efficiency (~$0.25/1M input tokens)
- **SSE**: Server-Sent Events for real-time streaming

### Component Structure

```
ChatInterface (main orchestrator)
├── Sidebar (conversation threads, theme toggle)
│   ├── Conversation list
│   └── ThemeToggle (dark mode)
├── MessageList (displays messages)
│   └── Message (individual message with markdown)
│       ├── Markdown rendering (react-markdown)
│       └── Code highlighting (react-syntax-highlighter)
└── MessageInput (textarea with auto-resize)
```

### Key Features Implementation

1. **Streaming**:
   - API route uses `ReadableStream` to stream chunks
   - `updateLastMessage()` in context updates message in real-time
   - Loading spinner shown while streaming

2. **Dark Mode**:
   - Tailwind's `dark:` classes with `class` strategy
   - ThemeToggle manipulates `document.documentElement.classList`
   - Persists across component re-renders

3. **Markdown**:
   - `react-markdown` with `remark-gfm` for GitHub-flavored markdown
   - `react-syntax-highlighter` with `oneDark`/`oneLight` themes
   - Copy-to-clipboard for code blocks

4. **Responsive**:
   - Mobile: Sidebar as drawer overlay
   - Desktop: Fixed sidebar, always visible
   - Tailwind breakpoints: `lg:` for desktop behavior

## File Organization

- `app/`: Next.js app directory (pages, layouts, API routes)
- `components/`: React components (all client components)
- `lib/`: Utilities and context (ChatContext, types)
- No `src/` directory - using Next.js 14 convention

## Development Notes

- All components are client components (`'use client'`) due to state/effects
- API route uses Edge Runtime for better streaming performance
- TypeScript strict mode enabled
- No database - intentionally session-based for portfolio demo
