'use client';

import React, { useEffect, useRef } from 'react';
import Message from './Message';
import { Message as MessageType } from '@/lib/types';
import { Spinner } from 'flowbite-react';

interface MessageListProps {
  messages: MessageType[];
  isStreaming: boolean;
  isDark?: boolean;
}

export default function MessageList({ messages, isStreaming, isDark = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent relative">
              PopeGPT
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-md text-lg mb-8">
            Welcome! Start a conversation by typing a message below.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            {[
              { icon: "💡", text: "Ask me anything" },
              { icon: "🚀", text: "Get creative ideas" },
              { icon: "📝", text: "Help with writing" }
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all hover:scale-105">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div key={message.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
              <Message message={message} isDark={isDark} />
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start mb-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-700 rounded-2xl px-5 py-4 shadow-md border border-gray-200/50 dark:border-gray-600/50">
                <Spinner size="sm" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
