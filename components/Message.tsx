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
}

export default function Message({ message, isDark = false }: MessageProps) {
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
      } mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
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
                    <div className="relative group">
                      <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 px-4 py-2 rounded-t-md">
                        <span className="text-xs text-gray-300">
                          {match[1]}
                        </span>
                        <button
                          onClick={() => copyToClipboard(codeString, codeId)}
                          className="text-gray-300 hover:text-white transition-colors"
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
                        className="!mt-0 !rounded-t-none"
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-sm"
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
