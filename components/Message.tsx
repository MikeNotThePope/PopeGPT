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
      } mb-6 group`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 transition-all duration-200 ${
          isUser
            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
                    <div className="relative group/code my-4 rounded-lg overflow-hidden shadow-md">
                      <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black px-4 py-2">
                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                          {match[1]}
                        </span>
                        <button
                          onClick={() => copyToClipboard(codeString, codeId)}
                          className="text-gray-400 hover:text-white transition-all hover:scale-110"
                          title="Copy code"
                        >
                          {copiedCode === codeId ? (
                            <HiClipboardCheck className="w-4 h-4 text-green-400" />
                          ) : (
                            <HiClipboard className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={isDark ? oneDark : oneLight}
                        language={match[1]}
                        PreTag="div"
                        className="!mt-0 !rounded-t-none !text-sm"
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className="bg-blue-100 dark:bg-gray-600 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-mono text-sm"
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
