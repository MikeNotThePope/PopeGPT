'use client';

import React, { useEffect, useState } from 'react';
import { HiMoon, HiSun } from 'react-icons/hi';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    let isDarkMode = false;

    if (savedTheme === 'dark' || savedTheme === 'light') {
      isDarkMode = savedTheme === 'dark';
    } else {
      // No saved preference - use system preference
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(isDarkMode);

    // Listen for system preference changes (only if no manual override)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't set a manual preference
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme || (savedTheme !== 'dark' && savedTheme !== 'light')) {
        const newIsDark = e.matches;
        setIsDark(newIsDark);

        if (newIsDark) {
          document.documentElement.classList.add('dark');
          updateFaviconDirect('/api/favicon-dark');
        } else {
          document.documentElement.classList.remove('dark');
          updateFaviconDirect('/api/favicon');
        }

        function updateFaviconDirect(url: string) {
          const oldFavicon = document.getElementById('favicon');
          if (oldFavicon) oldFavicon.remove();
          const newFavicon = document.createElement('link');
          newFavicon.id = 'favicon';
          newFavicon.rel = 'icon';
          newFavicon.type = 'image/svg+xml';
          newFavicon.href = url;
          document.head.appendChild(newFavicon);
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      updateFavicon('/api/favicon-dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      updateFavicon('/api/favicon');
    }
  };

  const updateFavicon = (url: string) => {
    // Remove old favicon
    const oldFavicon = document.getElementById('favicon');
    if (oldFavicon) {
      oldFavicon.remove();
    }

    // Create and add new favicon
    const newFavicon = document.createElement('link');
    newFavicon.id = 'favicon';
    newFavicon.rel = 'icon';
    newFavicon.type = 'image/svg+xml';
    newFavicon.href = url;
    document.head.appendChild(newFavicon);
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
