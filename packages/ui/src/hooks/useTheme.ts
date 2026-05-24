import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  getStoredTheme,
  resolveTheme,
  setStoredTheme,
  type ResolvedTheme,
  type Theme,
} from '../lib/theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getStoredTheme()));

  useEffect(() => {
    const r = resolveTheme(theme);
    setResolved(r);
    applyTheme(r);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const r: ResolvedTheme = mq.matches ? 'dark' : 'light';
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setStoredTheme(t);
    setThemeState(t);
  }, []);

  return { theme, resolved, setTheme };
}
