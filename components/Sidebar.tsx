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
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PopeGPT
              </h1>
              <button
                onClick={onClose}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>
            <Button onClick={onNewChat} color="blue" className="w-full">
              <HiPlus className="mr-2 h-5 w-5" />
              New Chat
            </Button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  onSelectConversation(conversation.id);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors flex items-center gap-2 ${
                  conversation.id === currentConversationId
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <HiChat className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm">{conversation.title}</span>
              </button>
            ))}
          </div>

          {/* Footer with theme toggle */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <ThemeToggle />
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              Powered by Claude 3 Haiku
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
