'use client';

import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button, Textarea, Spinner } from 'flowbite-react';
import { HiPaperAirplane, HiPaperClip, HiX } from 'react-icons/hi';
import { FileAttachment } from '@/lib/types';

interface MessageInputProps {
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when AI finishes responding
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Convert file to base64 data URL
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        data: dataUrl,
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !disabled) {
      onSend(input, attachments.length > 0 ? attachments : undefined);
      setInput('');
      setAttachments([]);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="border-t-4 border-black dark:border-white bg-cyan-300 dark:bg-purple-600 px-4 py-4">
      <div className="max-w-4xl mx-auto">
        {/* File attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-white dark:bg-black border-2 border-black dark:border-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                {attachment.type.startsWith('image/') && (
                  <img
                    src={attachment.data}
                    alt={attachment.name}
                    className="h-8 w-8 object-cover border-2 border-black dark:border-white"
                  />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate max-w-[150px]">
                    {attachment.name}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatFileSize(attachment.size)}
                  </span>
                </div>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  disabled={disabled}
                  className="ml-1 p-1 hover:bg-red-500 hover:text-white transition-colors border-2 border-black dark:border-white disabled:opacity-50"
                  title="Remove file"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-stretch gap-3">
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
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={disabled}
              className="hidden"
              accept="*/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="h-11 w-11 bg-yellow-400 dark:bg-pink-500 text-black dark:text-white border-4 border-black dark:border-white font-black uppercase flex items-center transition-all justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              title="Attach files"
            >
              <HiPaperClip className="h-5 w-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={disabled || (!input.trim() && attachments.length === 0)}
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
    </div>
  );
}
