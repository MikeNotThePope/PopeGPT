'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import Message from './Message';
import { Message as MessageType } from '@/lib/types';

interface MessageListProps {
  messages: MessageType[];
  isStreaming: boolean;
  isDark?: boolean;
}

export default function MessageList({ messages, isStreaming, isDark = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const appName = useMemo(() => `${process.env.NEXT_PUBLIC_USERNAME || 'Pope'}GPT`, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Smooth scroll during streaming (no behavior: smooth for better performance)
  const scrollToBottomImmediate = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-black dark:scrollbar-thumb-white scrollbar-track-transparent"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="mb-8 p-6 bg-yellow-300 dark:bg-cyan-400 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <h2 className="text-6xl font-black text-black uppercase tracking-tight">
              {appName}
            </h2>
          </div>
          <p className="text-black dark:text-white max-w-md text-xl font-bold mb-8 uppercase">
            Start Chatting Now!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            {[
              { icon: "💡", text: "Ask me anything", bg: "bg-pink-400" },
              { icon: "🚀", text: "Get creative ideas", bg: "bg-cyan-400" },
              { icon: "📝", text: "Help with writing", bg: "bg-lime-400" }
            ].map((item, i) => (
              <div key={i} className={`p-5 ${item.bg} border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all`}>
                <div className="text-4xl mb-2">{item.icon}</div>
                <div className="text-sm text-black font-black uppercase">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div key={message.id}>
              <Message
                message={message}
                isDark={isDark}
                isStreaming={isStreaming && index === messages.length - 1}
                onContentChange={scrollToBottomImmediate}
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
