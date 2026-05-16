import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeId = 'midnight' | 'aurora' | 'forest' | 'sunset';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  tagline: string;
  swatch: [string, string, string];
  mode: 'dark' | 'light';
}

export const THEMES: ThemeOption[] = [
  {
    id: 'midnight',
    name: 'Midnight Tech',
    tagline: 'Cyan and violet on deep navy',
    swatch: ['#0d1828', '#22d3ee', '#8b5cf6'],
    mode: 'dark',
  },
  {
    id: 'aurora',
    name: 'Aurora Light',
    tagline: 'Crisp white with indigo accents',
    swatch: ['#f7f9fc', '#4f46e5', '#a855f7'],
    mode: 'light',
  },
  {
    id: 'forest',
    name: 'Forest Focus',
    tagline: 'Calm slate green and mint',
    swatch: ['#102a23', '#6ee7b7', '#2dd4bf'],
    mode: 'dark',
  },
  {
    id: 'sunset',
    name: 'Sunset Studio',
    tagline: 'Warm tones for creative flow',
    swatch: ['#321a1e', '#fb923c', '#f472b6'],
    mode: 'dark',
  },
];

const STORAGE_KEY = 'flowdesk.theme';
const DEFAULT_THEME: ThemeId = 'midnight';

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeAttribute(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme =
    theme === 'aurora' ? 'light' : 'dark';
}

function readStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'midnight' || stored === 'aurora' || stored === 'forest' || stored === 'sunset') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => readStoredTheme());

  useEffect(() => {
    applyThemeAttribute(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = (next: ThemeId) => setThemeState(next);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
