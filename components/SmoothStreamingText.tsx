'use client';

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { useSmoothStreaming } from '@/lib/useSmoothStreaming';
import { HiClipboard, HiClipboardCheck } from 'react-icons/hi';

interface SmoothStreamingTextProps {
  /**
   * The message ID (for copy-to-clipboard keys)
   */
  messageId: string;

  /**
   * The final message content (authoritative source from React state)
   */
  finalMessageContent: string;

  /**
   * Whether dark mode is active
   */
  isDark?: boolean;

  /**
   * Callback when content height changes (for auto-scroll)
   */
  onContentChange?: () => void;

  /**
   * Characters per second for typewriter effect
   */
  charsPerSecond?: number;
}

export interface SmoothStreamingTextRef {
  addChunk: (chunk: string) => void;
  finishStreaming: () => void;
  reset: () => void;
  skipToEnd: () => void;
}

const SmoothStreamingText = forwardRef<SmoothStreamingTextRef, SmoothStreamingTextProps>(
  ({ messageId, finalMessageContent, isDark = false, onContentChange, charsPerSecond = 80 }, ref) => {
    const textRef = useRef<HTMLDivElement>(null);
    const [isStreamingComplete, setIsStreamingComplete] = useState(false);
    const [isActivelyStreaming, setIsActivelyStreaming] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    };

    // Handle smooth streaming with direct DOM manipulation
    const smoothStreaming = useSmoothStreaming({
      charsPerSecond,
      onUpdate: (displayedText) => {
        // Direct DOM manipulation - no React re-render!
        if (textRef.current) {
          textRef.current.textContent = displayedText;

          // Trigger scroll callback
          if (onContentChange) {
            onContentChange();
          }
        }

        // Enable will-change optimization during active streaming
        if (!isActivelyStreaming) {
          setIsActivelyStreaming(true);
        }
      },
      onComplete: () => {
        // Streaming complete - remove will-change and switch to markdown rendering
        setIsActivelyStreaming(false);
        setIsStreamingComplete(true);
      },
    });

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      addChunk: smoothStreaming.addChunk,
      finishStreaming: smoothStreaming.finishStreaming,
      reset: () => {
        smoothStreaming.reset();
        setIsStreamingComplete(false);
        setIsActivelyStreaming(false);
      },
      skipToEnd: smoothStreaming.skipToEnd,
    }));

    if (isStreamingComplete) {
      // Render full markdown after streaming completes
      return (
        <div className="prose dark:prose-invert max-w-none prose-p:font-bold prose-li:font-bold prose-headings:font-black leading-relaxed font-bold text-black dark:text-white">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              code({ inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                const codeId = `${messageId}-${match?.[1] || 'code'}`;

                return !inline && match ? (
                  <div className="relative my-4 border-4 border-black dark:border-white overflow-hidden">
                    <div className="flex items-center justify-between bg-yellow-300 dark:bg-cyan-400 border-b-4 border-black dark:border-white px-4 py-2">
                      <span className="text-xs font-black text-black uppercase tracking-wider">
                        {match[1]}
                      </span>
                      <button
                        onClick={() => copyToClipboard(codeString, codeId)}
                        className="bg-black dark:bg-white text-white dark:text-black px-2 py-1 border-2 border-black dark:border-white hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors font-bold"
                        title="Copy code"
                      >
                        {copiedCode === codeId ? (
                          <HiClipboardCheck className="w-4 h-4" />
                        ) : (
                          <HiClipboard className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={isDark ? oneDark : oneLight}
                      language={match[1]}
                      PreTag="div"
                      className="!mt-0 !text-sm !bg-white dark:!bg-black"
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code
                    className="bg-pink-300 dark:bg-cyan-400 text-black px-2 py-1 border-2 border-black dark:border-white font-mono text-sm font-bold"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {finalMessageContent}
          </ReactMarkdown>
        </div>
      );
    }

    // During streaming: show plain text with direct DOM updates (no React re-renders)
    return (
      <div
        ref={textRef}
        className="whitespace-pre-wrap leading-relaxed font-bold"
        style={{
          minHeight: '1.5em',
          // Apply will-change only during active streaming for GPU optimization
          willChange: isActivelyStreaming ? 'contents' : 'auto'
        }}
      >
        {/* Content is updated via direct DOM manipulation in onUpdate callback */}
      </div>
    );
  }
);

SmoothStreamingText.displayName = 'SmoothStreamingText';

export default SmoothStreamingText;
