'use client';

import React, { useEffect, useState } from 'react';
import { HiMoon, HiSun } from 'react-icons/hi';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if dark mode is enabled
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return <div className="h-10 w-full" />;
  }

  return (
    <div className="flex items-center justify-center w-full">
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isDark ? 'bg-blue-600' : 'bg-yellow-400'
        }`}
        aria-label="Toggle theme"
      >
        <span className="absolute left-2">
          <HiSun className="w-4 h-4 text-white" />
        </span>
        <span className="absolute right-2">
          <HiMoon className="w-4 h-4 text-white" />
        </span>
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform flex items-center justify-center ${
            isDark ? 'translate-x-8' : 'translate-x-1'
          }`}
        >
          {isDark ? (
            <HiMoon className="w-4 h-4 text-blue-600" />
          ) : (
            <HiSun className="w-4 h-4 text-yellow-500" />
          )}
        </span>
      </button>
    </div>
  );
}
