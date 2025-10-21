'use client';

import React, { useEffect, useState } from 'react';
import { ToggleSwitch } from 'flowbite-react';
import { HiMoon, HiSun } from 'react-icons/hi';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <HiSun className={`w-5 h-5 ${!isDark ? 'text-yellow-500' : 'text-gray-400'}`} />
        <HiMoon className={`w-5 h-5 ${isDark ? 'text-blue-500' : 'text-gray-400'}`} />
      </div>
      <ToggleSwitch checked={isDark} onChange={toggleTheme} />
    </div>
  );
}
