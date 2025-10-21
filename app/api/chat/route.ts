import { NextRequest } from 'next/server';
import { MAX_REQUEST_BODY_SIZE, MAX_ATTACHMENTS, MAX_MESSAGE_LENGTH, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '@/lib/constants';

export const runtime = 'edge';

// Simple in-memory rate limiter (NOTE: resets on deployment, use Redis/KV for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 data URL
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: FileAttachment[];
}

interface ContentBlock {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting based on IP address
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return new Response('Rate limit exceeded. Please try again later.', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString(),
        }
      });
    }

    // Check Content-Length header to prevent oversized requests
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_BODY_SIZE) {
      return new Response('Request body too large', { status: 413 });
    }

    const { messages } = await req.json() as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request body', { status: 400 });
    }

    // Validate messages
    for (const message of messages) {
      // Check message length
      if (message.content && message.content.length > MAX_MESSAGE_LENGTH) {
        return new Response('Message content too long', { status: 400 });
      }

      // Check attachment count
      if (message.attachments && message.attachments.length > MAX_ATTACHMENTS) {
        return new Response('Too many attachments', { status: 400 });
      }
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response('API key not configured', { status: 500 });
    }

    // PopeGPT system prompt
    const systemPrompt = {
      role: 'system',
      content: `You are PopeGPT, an AI assistant accessed through the PopeGPT browser interface. You were created to help users with coding, writing, analysis, and general questions.

When users ask who you are or what system you're using, you respond that you are PopeGPT. You do not mention Claude, Anthropic, or any other AI system.

You maintain a helpful, knowledgeable, and friendly personality. You approach problems thoughtfully and provide clear, practical solutions.

Key guidelines:
- Identify as PopeGPT when asked about your identity
- Refer to your interface as "PopeGPT" or "this chat interface"
- Never mention Claude, Anthropic, or other AI systems
- Maintain the same helpful, capable personality
- Focus on providing excellent assistance with whatever the user needs

You have access to various tools and capabilities to help users with their tasks. Proceed naturally and helpfully with all requests.`
    };

    // Transform messages to support multimodal content (images, files)
    const formattedMessages = messages.map(msg => {
      if (!msg.attachments || msg.attachments.length === 0) {
        return { role: msg.role, content: msg.content };
      }

      // Build content array with text and attachments
      const contentBlocks: ContentBlock[] = [];

      // Add text content if present
      if (msg.content && msg.content.trim()) {
        contentBlocks.push({
          type: 'text',
          text: msg.content,
        });
      }

      // Add image attachments
      msg.attachments.forEach(attachment => {
        if (attachment.type.startsWith('image/')) {
          contentBlocks.push({
            type: 'image_url',
            image_url: {
              url: attachment.data, // base64 data URL
            },
          });
        } else {
          // For non-image files, include file info in text
          contentBlocks.push({
            type: 'text',
            text: `[Attached file: ${attachment.name} (${attachment.type}, ${(attachment.size / 1024).toFixed(1)} KB)]`,
          });
        }
      });

      return {
        role: msg.role,
        content: contentBlocks,
      };
    });

    // Add system prompt at the beginning
    const messagesWithSystem = [systemPrompt, ...formattedMessages];

    // Call OpenRouter API with streaming
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': appUrl,
        'X-Title': 'PopeGPT',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: messagesWithSystem,
        stream: true,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return new Response(`OpenRouter API error: ${response.statusText}`, {
        status: response.status
      });
    }

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            // Decode and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;

              if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    // Send the content chunk
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
