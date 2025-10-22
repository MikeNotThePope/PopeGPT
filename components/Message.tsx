'use client';

import React, { useRef, useEffect, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Message as MessageType } from '@/lib/types';
import { STREAMING_CHARS_PER_SECOND } from '@/lib/constants';
import { HiClipboard, HiClipboardCheck, HiDocumentText, HiDownload, HiRefresh } from 'react-icons/hi';
import SmoothStreamingText, { SmoothStreamingTextRef } from './SmoothStreamingText';

interface MessageProps {
  message: MessageType;
  isDark?: boolean;
  isStreaming?: boolean;
  isDataStreaming?: boolean; // Separate flag for actual data streaming vs animation
  onContentChange?: () => void;
  onAnimationComplete?: () => void;
  onRetry?: (messageId: string) => void;
}

const MessageComponent = React.forwardRef<HTMLDivElement, MessageProps>(({ message, isDark = false, isStreaming = false, isDataStreaming, onContentChange, onAnimationComplete, onRetry }, ref) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = React.useState(false);
  const smoothStreamingRef = useRef<SmoothStreamingTextRef>(null);
  const previousContentRef = useRef<string>('');
  const previousStreamingRef = useRef<boolean>(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyMessageToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isUser = message.role === 'user';

  // Handle streaming state changes and content updates
  useEffect(() => {
    if (!isStreaming || isUser || !smoothStreamingRef.current) return;

    const currentContent = message.content;
    const previousContent = previousContentRef.current;

    // Streaming just started - reset and add all current content
    // Use previousContent as the guard instead of previousStreamingRef to survive Strict Mode remounts
    if (!previousStreamingRef.current && isStreaming && previousContent === '') {
      smoothStreamingRef.current.reset();
      if (currentContent) {
        smoothStreamingRef.current.addChunk(currentContent);
      }
      previousContentRef.current = currentContent;
      previousStreamingRef.current = true;
      return;
    }

    // Calculate the delta (new chunk) for subsequent updates
    if (currentContent.length > previousContent.length && (previousContent !== '' || previousStreamingRef.current)) {
      const chunk = currentContent.slice(previousContent.length);
      smoothStreamingRef.current.addChunk(chunk);
      previousContentRef.current = currentContent;
    }
  }, [message.content, isStreaming, isUser]);

  // Handle streaming completion
  // Use isDataStreaming if provided, otherwise fall back to isStreaming
  const dataStreamingFlag = isDataStreaming !== undefined ? isDataStreaming : isStreaming;

  useLayoutEffect(() => {
    if (!isUser && previousStreamingRef.current && !dataStreamingFlag && smoothStreamingRef.current) {
      smoothStreamingRef.current.finishStreaming();
      previousStreamingRef.current = false;
    }
  }, [dataStreamingFlag, isUser]);

  return (
    <div
      ref={ref}
      className={`flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      } mb-5 message-content`}
    >
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div
          className={`border-4 px-5 py-4 transition-all ${
            isUser
              ? 'bg-blue-400 dark:bg-purple-500 text-black dark:text-white border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
              : 'bg-white dark:bg-gray-900 text-black dark:text-white border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
          }`}
        >
        {/* Display file attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {message.attachments.map(attachment => {
              if (attachment.type.startsWith('image/')) {
                return (
                  <div key={attachment.id} className="border-2 border-black dark:border-white overflow-hidden">
                    <img
                      src={attachment.data}
                      alt={attachment.name}
                      className="max-w-full h-auto"
                    />
                    <div className="bg-yellow-300 dark:bg-cyan-400 border-t-2 border-black dark:border-white px-2 py-1">
                      <span className="text-xs font-bold text-black">{attachment.name}</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <a
                    key={attachment.id}
                    href={attachment.data}
                    download={attachment.name}
                    className="flex items-center gap-2 bg-yellow-300 dark:bg-cyan-400 border-2 border-black dark:border-white px-3 py-2 hover:bg-yellow-400 dark:hover:bg-cyan-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
                  >
                    <HiDocumentText className="h-5 w-5 text-black" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-black truncate">{attachment.name}</div>
                      <div className="text-xs text-gray-700">{formatFileSize(attachment.size)}</div>
                    </div>
                    <HiDownload className="h-4 w-4 text-black" />
                  </a>
                );
              }
            })}
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed font-bold">{message.content}</p>
        ) : isStreaming ? (
          <SmoothStreamingText
            ref={smoothStreamingRef}
            messageId={message.id}
            finalMessageContent={message.content}
            isDark={isDark}
            onContentChange={onContentChange}
            onAnimationComplete={onAnimationComplete}
            charsPerSecond={STREAMING_CHARS_PER_SECOND}
          />
        ) : (
          <div className="prose dark:prose-invert max-w-none prose-p:font-bold prose-li:font-bold prose-headings:font-black leading-relaxed font-bold text-black dark:text-white">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const codeId = `${message.id}-${match?.[1] || 'code'}`;

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
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        </div>

        {/* Action buttons below message */}
        <div className="self-end flex items-center gap-2">
          <button
            onClick={copyMessageToClipboard}
            className="p-1 text-gray-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 text-xs"
            title={copiedMessage ? 'Copied!' : 'Copy message'}
            aria-label={copiedMessage ? 'Copied!' : 'Copy message'}
          >
            {copiedMessage ? (
              <HiClipboardCheck className="w-4 h-4" />
            ) : (
              <HiClipboard className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onRetry?.(message.id)}
            className="p-1 text-gray-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 text-xs"
            title="Retry"
            aria-label="Retry"
          >
            <HiRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

MessageComponent.displayName = 'MessageComponent';

const Message = React.memo(MessageComponent, (prevProps, nextProps) => {
  // During streaming, always re-render to process new chunks
  if (nextProps.isStreaming) {
    return false;
  }

  // If streaming just stopped, allow re-render to show final markdown
  if (prevProps.isStreaming && !nextProps.isStreaming) {
    return false;
  }

  // For completed messages, prevent unnecessary re-renders
  // Deep comparison for attachments array
  const prevAttachments = prevProps.message.attachments || [];
  const nextAttachments = nextProps.message.attachments || [];
  const attachmentsEqual =
    prevAttachments.length === nextAttachments.length &&
    prevAttachments.every((att, i) => att.id === nextAttachments[i]?.id);

  return prevProps.message.id === nextProps.message.id &&
         prevProps.message.content === nextProps.message.content &&
         prevProps.isDark === nextProps.isDark &&
         prevProps.isStreaming === nextProps.isStreaming &&
         attachmentsEqual;
});

Message.displayName = 'Message';

export default Message;
