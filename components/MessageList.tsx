'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import Message from './Message';
import { Message as MessageType } from '@/lib/types';

interface MessageListProps {
  messages: MessageType[];
  isStreaming: boolean;
  isAnimating?: boolean;
  isDark?: boolean;
  onAnimationComplete?: () => void;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

export default function MessageList({ messages, isStreaming, isAnimating = false, isDark = false, onAnimationComplete, onRetry, onEdit }: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const appName = useMemo(() => `${process.env.NEXT_PUBLIC_USERNAME || 'Pope'}GPT`, []);
  const scrollAnimationFrame = useRef<number | null>(null);

  // Throttled scroll during streaming (~60fps max, ~16.67ms between scrolls)
  const scrollToBottomImmediate = useCallback(() => {
    if (scrollAnimationFrame.current !== null) {
      // Already scheduled, skip this call
      return;
    }

    scrollAnimationFrame.current = requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: 'end',
        behavior: 'auto'
      });
      scrollAnimationFrame.current = null;
    });
  }, [messages.length]);

  // Auto-scroll when new messages are added (non-streaming)
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: 'end',
        behavior: 'smooth'
      });
    }
  }, [messages.length, isStreaming]);

  // Cleanup scroll animation frame on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationFrame.current !== null) {
        cancelAnimationFrame(scrollAnimationFrame.current);
      }
    };
  }, []);

  // Empty state component
  const EmptyPlaceholder = useCallback(() => (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
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
  ), [appName]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-black dark:scrollbar-thumb-white scrollbar-track-transparent">
        <EmptyPlaceholder />
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={messages}
      className="flex-1 scrollbar-thin scrollbar-thumb-black dark:scrollbar-thumb-white scrollbar-track-transparent"
      style={{ height: '100%' }}
      followOutput="smooth"
      itemContent={(index, message) => {
        const isLastMessage = index === messages.length - 1;
        return (
          <div className="px-4 py-3">
            <Message
              message={message}
              isDark={isDark}
              isStreaming={(isStreaming || isAnimating) && isLastMessage}
              isDataStreaming={isStreaming && isLastMessage}
              onContentChange={scrollToBottomImmediate}
              onAnimationComplete={onAnimationComplete}
              onRetry={onRetry}
              onEdit={onEdit}
            />
          </div>
        );
      }}
      components={{
        // Add top padding
        Header: () => <div className="py-3" />,
        // Add bottom padding
        Footer: () => <div className="py-3" />
      }}
    />
  );
}
