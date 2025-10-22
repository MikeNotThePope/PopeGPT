'use client';

import React, { useState, useRef } from 'react';
import { useChatContext } from '@/lib/ChatContext';
import { FileAttachment } from '@/lib/types';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import MessageInput, { MessageInputRef } from './MessageInput';
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
    truncateMessagesAfter,
    removeMessagesFrom,
  } = useChatContext();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const messageInputRef = useRef<MessageInputRef>(null);

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
    setIsAnimating(false);

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

      // Mark that we're waiting for animation to complete
      setIsAnimating(true);

      // Set isStreaming to false to trigger finishStreaming() in Message component
      // But input will stay disabled because isAnimating is true
      setIsStreaming(false);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending message:', error);
      }
      addMessage(
        'Sorry, there was an error processing your request. Please try again.',
        'assistant'
      );
      // On error, stop streaming and animating immediately
      setIsStreaming(false);
      setIsAnimating(false);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    if (!currentConversation) {
      return;
    }

    // Reset streaming states
    if (isStreaming || isAnimating) {
      setIsStreaming(false);
      setIsAnimating(false);
    }

    // Find the message
    const messageIndex = currentConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return;
    }

    const message = currentConversation.messages[messageIndex];
    if (message.role !== 'user') {
      return;
    }

    // Remove this message and everything after it
    removeMessagesFrom(messageId);

    // Send the new content as a new message
    await handleSendMessage(newContent, message.attachments);
  };

  const handleRetry = async (messageId: string) => {
    if (!currentConversation) {
      return;
    }

    // Reset streaming states to ensure we can retry even if previous operation got stuck
    if (isStreaming || isAnimating) {
      setIsStreaming(false);
      setIsAnimating(false);
    }

    // Find the message index
    const messageIndex = currentConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      return;
    }

    const messageToRetry = currentConversation.messages[messageIndex];

    // Determine which messages to keep and which user message to resubmit
    let truncatedMessages: typeof currentConversation.messages;
    let truncateAfterMessageId: string;

    if (messageToRetry.role === 'user') {
      // Clicking retry on a user message: keep up to and including this message
      truncatedMessages = currentConversation.messages.slice(0, messageIndex + 1);
      truncateAfterMessageId = messageId;
    } else {
      // Clicking retry on an assistant message: remove this message and everything after
      // Then find the previous user message to resubmit
      truncatedMessages = currentConversation.messages.slice(0, messageIndex);

      // Find the last user message before this point
      const lastUserMessage = truncatedMessages.reverse().find(m => m.role === 'user');
      if (!lastUserMessage) return; // No user message to retry

      truncatedMessages = currentConversation.messages.slice(
        0,
        currentConversation.messages.findIndex(m => m.id === lastUserMessage.id) + 1
      );
      truncateAfterMessageId = lastUserMessage.id;
    }

    // Truncate all messages after the target message in the UI
    truncateMessagesAfter(truncateAfterMessageId);

    // Re-submit the user message (but don't add it to UI again - it's already there)
    setIsStreaming(true);
    setIsAnimating(false);

    try {
      // Prepare messages for API using the truncated messages we calculated
      const messages = truncatedMessages.map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

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

      // Mark that we're waiting for animation to complete
      setIsAnimating(true);

      // Set isStreaming to false to trigger finishStreaming() in Message component
      // But input will stay disabled because isAnimating is true
      setIsStreaming(false);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error retrying message:', error);
      }
      addMessage(
        'Sorry, there was an error processing your request. Please try again.',
        'assistant'
      );
      // On error, stop streaming and animating immediately
      setIsStreaming(false);
      setIsAnimating(false);
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
          isAnimating={isAnimating}
          isDark={isDark}
          onAnimationComplete={handleAnimationComplete}
          onRetry={handleRetry}
          onEdit={handleEdit}
        />
        <MessageInput
          ref={messageInputRef}
          onSend={handleSendMessage}
          disabled={isStreaming || isAnimating}
        />
      </div>
    </div>
  );
}
