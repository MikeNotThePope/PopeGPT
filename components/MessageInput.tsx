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
    <div className="border-t-4 border-black dark:border-white bg-cyan-300 dark:bg-purple-600 px-4 py-4">
      <div className="flex items-stretch gap-3 max-w-4xl mx-auto">
        <div className="flex-1 flex items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="TYPE YOUR MESSAGE..."
            disabled={disabled}
            rows={1}
            className="resize-none w-full !bg-white dark:!bg-black !border-4 !border-black dark:!border-white focus:!border-black dark:focus:!border-white !ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-bold placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-black placeholder:uppercase"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="h-11 w-32 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white font-black uppercase flex items-center gap-2 transition-all justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
          {disabled ? (
            <>
              <Spinner size="sm" />
              <span>Sending</span>
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
