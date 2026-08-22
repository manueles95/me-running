import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const KEY = 'rtl-theme';

function initialTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* localStorage may be unavailable; fall through to system default */
  }
  return null;
}

export function ThemeToggle() {
  // null = follow the system preference (no data-theme attribute set).
  const [theme, setTheme] = useState<Theme | null>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) {
      root.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(KEY, theme);
      } catch {
        /* ignore persistence failures */
      }
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  const resolved: Theme =
    theme ??
    (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const next: Theme = resolved === 'dark' ? 'light' : 'dark';

  return (
    <div className="topbar">
      <button
        type="button"
        className="theme-toggle mono"
        onClick={() => setTheme(next)}
        aria-label={`Switch to ${next} theme`}
        title={`Switch to ${next} theme`}
      >
        <span aria-hidden="true">{resolved === 'dark' ? '◐' : '◑'}</span>
        <span>{resolved === 'dark' ? 'pre-dawn' : 'dawn'}</span>
      </button>
    </div>
  );
}
