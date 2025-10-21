'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Message, Conversation, ChatContextType, FileAttachment } from './types';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationCounter = React.useRef(0);
  const initialized = React.useRef(false);

  const createNewConversation = useCallback(() => {
    conversationCounter.current += 1;
    const newConversation: Conversation = {
      id: `${Date.now()}-${conversationCounter.current}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  }, []);

  const getCurrentConversation = useCallback(() => {
    return conversations.find(c => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  const addMessage = useCallback((content: string, role: 'user' | 'assistant', attachments?: FileAttachment[]) => {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      timestamp: Date.now(),
      attachments,
    };

    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === currentConversationId) {
          const updatedMessages = [...conv.messages, message];

          // Auto-generate title from first user message
          let updatedTitle = conv.title;
          if (role === 'user' && conv.messages.length === 0) {
            updatedTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
          }

          return {
            ...conv,
            messages: updatedMessages,
            title: updatedTitle,
          };
        }
        return conv;
      });
      return updated;
    });
  }, [currentConversationId]);

  const updateLastMessage = useCallback((content: string) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === currentConversationId) {
          const messages = [...conv.messages];
          const lastMessage = messages[messages.length - 1];

          if (lastMessage && lastMessage.role === 'assistant') {
            messages[messages.length - 1] = {
              ...lastMessage,
              content,
            };
          }

          return {
            ...conv,
            messages,
          };
        }
        return conv;
      });
    });
  }, [currentConversationId]);

  const switchConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  // Initialize with first conversation
  React.useEffect(() => {
    if (!initialized.current && conversations.length === 0) {
      initialized.current = true;
      createNewConversation();
    }
  }, [conversations.length, createNewConversation]);

  const value: ChatContextType = {
    conversations,
    currentConversationId,
    addMessage,
    updateLastMessage,
    createNewConversation,
    switchConversation,
    getCurrentConversation,
    isStreaming,
    setIsStreaming,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
