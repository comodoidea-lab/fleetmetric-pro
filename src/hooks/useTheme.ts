// ============================================================
// FleetMetric Pro - Theme Hook
// stitch_UI の4デザインバリアントをテーマとして管理
// ============================================================

import { useState, useEffect } from 'react';

export type Theme = 'fleet-authority' | 'executive-blueprint' | 'arbor-ethos' | 'aero-kinetic';

export const THEMES: { id: Theme; label: string; color: string; labelJa: string }[] = [
  { id: 'fleet-authority',     label: 'Navy',      labelJa: 'Navy',      color: '#002045' },
  { id: 'executive-blueprint', label: 'Executive', labelJa: 'Executive', color: '#004a9a' },
  { id: 'arbor-ethos',         label: 'Eco',       labelJa: 'Eco',       color: '#0f5238' },
  { id: 'aero-kinetic',        label: 'Dark',      labelJa: 'Dark',      color: '#0b1326' },
];

const STORAGE_KEY = 'fleetmetric_theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && THEMES.some(t => t.id === stored)) return stored;
  return 'fleet-authority';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'fleet-authority') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);
  }

  return { theme, setTheme };
}
