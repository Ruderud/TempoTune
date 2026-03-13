'use client';

import { useEffect, useState } from 'react';
import {
  isThemePreference,
  resolveThemePreference,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme';

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getStoredThemePreference(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : 'system';
}

function applyThemePreference(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveThemePreference(preference, getSystemPrefersDark());
  const root = document.documentElement;

  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;

  if (preference === 'system') {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  }

  return resolved;
}

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const syncFromStorage = () => {
      const nextPreference = getStoredThemePreference();
      const nextResolved = applyThemePreference(nextPreference);
      setPreferenceState(nextPreference);
      setResolvedTheme(nextResolved);
    };

    syncFromStorage();

    const handleSystemThemeChange = () => {
      if (getStoredThemePreference() === 'system') {
        syncFromStorage();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) {
        syncFromStorage();
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleSystemThemeChange);
    }
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setPreference = (nextPreference: ThemePreference) => {
    const nextResolved = applyThemePreference(nextPreference);
    setPreferenceState(nextPreference);
    setResolvedTheme(nextResolved);
  };

  return {
    preference,
    resolvedTheme,
    setPreference,
  };
}
