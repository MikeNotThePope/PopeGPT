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
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
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
            className="resize-none w-full"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="h-11 w-32 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors justify-center"
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
