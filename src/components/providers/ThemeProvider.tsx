'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  }
  return theme;
}

export default function ThemeProvider({
  children,
  initialTheme = 'light',
  isLoggedIn = false,
}: {
  children: React.ReactNode;
  initialTheme?: string;
  isLoggedIn?: boolean;
}) {
  const pathname = usePathname();

  // ตอน mount: ถ้า login อยู่ → ใช้ค่าจาก DB เป็นหลัก (ป้องกัน localStorage เก่าค้าง)
  //             ถ้าไม่ login → ใช้ localStorage ก่อน แล้ว fallback ด้วย default
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      if (isLoggedIn) {
        // เมื่อ login ให้เชื่อ DB เสมอ
        const dbTheme = initialTheme as Theme;
        if (dbTheme === 'light' || dbTheme === 'dark' || dbTheme === 'system') {
          localStorage.setItem('prompty-theme', dbTheme);
          return dbTheme;
        }
      }
      // ไม่ login → ใช้ localStorage
      const saved = localStorage.getItem('prompty-theme') as Theme | null;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        return saved;
      }
    }
    return (initialTheme as Theme) || 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const isFixedThemePage = pathname?.startsWith('/admin');

  // เมื่อ user login (initialTheme หรือ isLoggedIn เปลี่ยน) → sync localStorage และ state ให้ตรง DB เสมอ
  useEffect(() => {
    if (!isLoggedIn) return;
    const validTheme = initialTheme as Theme;
    if (validTheme === 'light' || validTheme === 'dark' || validTheme === 'system') {
      setThemeState(validTheme);
      try {
        localStorage.setItem('prompty-theme', validTheme);
      } catch { /* ignore */ }
    }
  }, [initialTheme, isLoggedIn]);

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
