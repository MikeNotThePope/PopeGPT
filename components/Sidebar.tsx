'use client';

import React from 'react';
import { Button, Sidebar as FlowbiteSidebar } from 'flowbite-react';
import { HiPlus, HiChat, HiX } from 'react-icons/hi';
import { Conversation } from '@/lib/types';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                PopeGPT
              </h1>
              <button
                onClick={onClose}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all hover:rotate-90 duration-200"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={onNewChat}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <HiPlus className="h-5 w-5" />
              New Chat
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  onSelectConversation(conversation.id);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl mb-1.5 transition-all flex items-center gap-2 group ${
                  conversation.id === currentConversationId
                    ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-900 dark:text-blue-100 shadow-md'
                    : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:shadow-sm'
                }`}
              >
                <HiChat className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  conversation.id === currentConversationId ? 'text-blue-600 dark:text-blue-400' : ''
                }`} />
                <span className="truncate text-sm font-medium">{conversation.title}</span>
              </button>
            ))}
          </div>

          {/* Footer with theme toggle */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/50">
            <ThemeToggle />
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
              Powered by Claude 3 Haiku
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
