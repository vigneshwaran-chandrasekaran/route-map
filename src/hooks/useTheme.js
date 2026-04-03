import { useState, useEffect, useCallback } from 'react';

function getInitialTheme() {
  const saved = localStorage.getItem('route-map-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return 'system';
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem('route-map-theme', t);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return { theme, setTheme };
}
