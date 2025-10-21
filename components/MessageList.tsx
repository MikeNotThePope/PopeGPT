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
    <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            PopeGPT
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Welcome! Start a conversation by typing a message below.
          </p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <Message key={message.id} message={message} isDark={isDark} />
          ))}
          {isStreaming && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
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
