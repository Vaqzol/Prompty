'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark' | 'system';

const AUTH_PATHS = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/admin/login'];

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return theme;
}

export default function ThemeProvider({
  children,
  initialTheme = 'system',
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>((initialTheme as Theme) || 'system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const isFixedThemePage = pathname?.startsWith('/admin') || AUTH_PATHS.some((path) => pathname === path || pathname?.startsWith(path + '/'));

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem('prompty-theme', t);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (isFixedThemePage) {
      setResolvedTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
      return;
    }

    const resolved = getResolvedTheme(theme);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        document.documentElement.setAttribute('data-theme', newResolved);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, pathname, isFixedThemePage]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
