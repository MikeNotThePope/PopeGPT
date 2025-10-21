'use client';

import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button, Textarea, Spinner } from 'flowbite-react';
import { HiPaperAirplane } from 'react-icons/hi';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when AI finishes responding
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-4 shadow-lg">
      <div className="flex items-stretch gap-3 max-w-4xl mx-auto">
        <div className="flex-1 flex items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={disabled}
            rows={1}
            className="resize-none w-full !bg-gray-50 dark:!bg-gray-700/50 !border-gray-300/50 dark:!border-gray-600/50 focus:!border-blue-500 focus:!ring-blue-500/20 !rounded-xl shadow-sm"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="h-11 w-32 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-medium flex items-center gap-2 transition-all justify-center shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
          >
          {disabled ? (
            <>
              <Spinner size="sm" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <HiPaperAirplane className="h-5 w-5" />
              <span>Send</span>
            </>
          )}
          </button>
        </div>
      </div>
    </div>
  );
}
