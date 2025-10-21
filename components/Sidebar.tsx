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
  const appName = `${process.env.NEXT_PUBLIC_USERNAME || 'Pope'}GPT`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-lime-300 dark:bg-pink-500 border-r-4 border-black dark:border-white transform transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b-4 border-black dark:border-white">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">
                {appName}
              </h1>
              <button
                onClick={onClose}
                className="lg:hidden bg-black dark:bg-white text-white dark:text-black p-2 border-2 border-black dark:border-white hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={onNewChat}
              className="w-full px-4 py-3 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white font-black uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
            >
              <HiPlus className="h-5 w-5" />
              New Chat
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-black dark:scrollbar-thumb-white scrollbar-track-transparent p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  onSelectConversation(conversation.id);
                  onClose();
                }}
                className={`w-full text-left px-3 py-3 mb-2 transition-all flex items-center gap-2 border-3 font-bold ${
                  conversation.id === currentConversationId
                    ? 'bg-yellow-300 dark:bg-cyan-400 text-black border-4 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]'
                    : 'bg-white/50 dark:bg-black/30 text-black dark:text-white border-2 border-black dark:border-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                }`}
              >
                <HiChat className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-xs uppercase">{conversation.title}</span>
              </button>
            ))}
          </div>

          {/* Footer with theme toggle */}
          <div className="p-4 border-t-4 border-black dark:border-white">
            <ThemeToggle />
            <div className="mt-3 text-[10px] text-black dark:text-white text-center font-black uppercase">
              Powered by Claude 3 Haiku
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
