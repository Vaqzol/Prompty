'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_MAP: Record<string, string> = {
  'VS Code Dark Modern': '/hljs/vs2015.min.css',
  'GitHub Dark': '/hljs/github-dark.min.css',
  'Monokai': '/hljs/monokai.min.css',
  'One Dark Pro': '/hljs/atom-one-dark.min.css',
  'Night Owl': '/hljs/night-owl.min.css',
};

interface CodeThemeContextType {
  codeTheme: string;
  setCodeTheme: (t: string) => void;
}

const CodeThemeContext = createContext<CodeThemeContextType>({
  codeTheme: 'VS Code Dark Modern',
  setCodeTheme: () => {},
});

export const useCodeTheme = () => useContext(CodeThemeContext);

export default function CodeThemeProvider({
  children,
  initialCodeTheme = 'VS Code Dark Modern',
  isLoggedIn = false,
}: {
  children: React.ReactNode;
  initialCodeTheme?: string;
  isLoggedIn?: boolean;
}) {
  const [codeTheme, setCodeThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (isLoggedIn && initialCodeTheme) {
        localStorage.setItem('prompty-code-theme', initialCodeTheme);
        return initialCodeTheme;
      }
      const saved = localStorage.getItem('prompty-code-theme');
      if (saved && THEME_MAP[saved]) {
        return saved;
      }
    }
    return initialCodeTheme || 'VS Code Dark Modern';
  });

  useEffect(() => {
    if (!isLoggedIn || !initialCodeTheme) return;
    setCodeThemeState(initialCodeTheme);
    try {
      localStorage.setItem('prompty-code-theme', initialCodeTheme);
    } catch {
      /* ignore */
    }
  }, [initialCodeTheme, isLoggedIn]);

  const setCodeTheme = (t: string) => {
    setCodeThemeState(t);
    try {
      localStorage.setItem('prompty-code-theme', t);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const href = THEME_MAP[codeTheme] || THEME_MAP['VS Code Dark Modern'];
    const id = 'hljs-theme-link';
    let link = document.getElementById(id) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [codeTheme]);

  return (
    <CodeThemeContext.Provider value={{ codeTheme, setCodeTheme }}>
      {children}
    </CodeThemeContext.Provider>
  );
}
