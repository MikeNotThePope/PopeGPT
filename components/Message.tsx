'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Message as MessageType } from '@/lib/types';
import { Button } from 'flowbite-react';
import { HiClipboard, HiClipboardCheck } from 'react-icons/hi';

interface MessageProps {
  message: MessageType;
  isDark?: boolean;
  isStreaming?: boolean;
}

function MessageComponent({ message, isDark = false, isStreaming = false }: MessageProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      } mb-5 message-content`}
    >
      <div
        className={`max-w-[80%] border-4 px-5 py-4 transition-all ${
          isUser
            ? 'bg-blue-400 dark:bg-purple-500 text-black dark:text-white border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
            : 'bg-white dark:bg-gray-900 text-black dark:text-white border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed font-bold">{message.content}</p>
        ) : isStreaming ? (
          <div className="prose dark:prose-invert max-w-none prose-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none prose-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
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
    </div>
  );
}

const Message = React.memo(MessageComponent, (prevProps, nextProps) => {
  return prevProps.message.content === nextProps.message.content &&
         prevProps.isDark === nextProps.isDark &&
         prevProps.isStreaming === nextProps.isStreaming;
});

export default Message;
