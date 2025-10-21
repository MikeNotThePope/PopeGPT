'use client';

import React, { useState } from 'react';
import { useChatContext } from '@/lib/ChatContext';
import { FileAttachment } from '@/lib/types';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { HiMenu } from 'react-icons/hi';
import { Button } from 'flowbite-react';

export default function ChatInterface() {
  const {
    conversations,
    currentConversationId,
    addMessage,
    updateLastMessage,
    createNewConversation,
    switchConversation,
    getCurrentConversation,
    isStreaming,
    setIsStreaming,
  } = useChatContext();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    // Monitor dark mode changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    setIsDark(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  const currentConversation = getCurrentConversation();

  const handleSendMessage = async (content: string, attachments?: FileAttachment[]) => {
    if (!currentConversation || isStreaming) return;

    setIsStreaming(true);

    try {
      // Prepare messages for API (before adding to state to avoid race condition)
      const messages = [
        ...currentConversation.messages,
        { role: 'user' as const, content, attachments },
      ];

      // Add user message to UI
      addMessage(content, 'user', attachments);

      // Call streaming API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let assistantMessage = '';
      let hasStartedMessage = false;
      let updateFrameId: number | null = null;

      // Throttle updates using requestAnimationFrame for smooth rendering
      const scheduleUpdate = () => {
        if (updateFrameId) return;

        updateFrameId = requestAnimationFrame(() => {
          if (!hasStartedMessage) {
            addMessage(assistantMessage, 'assistant');
            hasStartedMessage = true;
          } else {
            updateLastMessage(assistantMessage);
          }
          updateFrameId = null;
        });
      };

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantMessage += parsed.content;
                  scheduleUpdate();
                }
              } catch (e) {
                // Skip invalid JSON chunks from streaming
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Invalid JSON chunk:', line, e);
                }
              }
            }
          }
        }
      } finally {
        // Cleanup animation frame if still pending
        if (updateFrameId) {
          cancelAnimationFrame(updateFrameId);
          updateFrameId = null;
        }
      }

      // Final update to ensure all content is shown
      if (!hasStartedMessage) {
        addMessage(assistantMessage, 'assistant');
      } else {
        updateLastMessage(assistantMessage);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending message:', error);
      }
      addMessage(
        'Sorry, there was an error processing your request. Please try again.',
        'assistant'
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={createNewConversation}
        onSelectConversation={switchConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1">
        {/* Mobile header */}
        <div className="lg:hidden border-b-4 border-black dark:border-white bg-yellow-300 dark:bg-purple-600 px-4 py-3">
          <Button
            color="gray"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className="!bg-black !text-white border-4 border-black hover:!bg-white hover:!text-black !transition-colors"
          >
            <HiMenu className="w-5 h-5" />
          </Button>
        </div>

        <MessageList
          messages={currentConversation?.messages || []}
          isStreaming={isStreaming}
          isDark={isDark}
        />
        <MessageInput onSend={handleSendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
