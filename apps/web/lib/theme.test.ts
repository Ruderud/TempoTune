// @vitest-environment node

import vm from 'node:vm';
import {
  getThemeBootstrapScript,
  resolveThemePreference,
  THEME_STORAGE_KEY,
} from './theme';

type ThemeRuntimeOptions = {
  prefersDark?: boolean;
  storedPreference?: 'light' | 'dark' | null;
};

type ThemeRuntime = {
  root: {
    dataset: Record<string, string>;
  };
  storage: Map<string, string>;
  fireMediaChange: (prefersDark: boolean) => void;
  fireStorageChange: (key: string | null) => void;
};

function createThemeRuntime({
  prefersDark = false,
  storedPreference = null,
}: ThemeRuntimeOptions = {}): ThemeRuntime {
  const storage = new Map<string, string>();
  const root = {
    dataset: {} as Record<string, string>,
  };
  const storageListeners: Array<(event: { key: string | null }) => void> = [];
  let mediaChangeListener: (() => void) | null = null;

  if (storedPreference) {
    storage.set(THEME_STORAGE_KEY, storedPreference);
  }

  const mediaQuery = {
    matches: prefersDark,
    addEventListener: (event: string, listener: () => void) => {
      if (event === 'change') {
        mediaChangeListener = listener;
      }
    },
    removeEventListener: () => {},
  };

  const context = {
    window: {
      matchMedia: () => mediaQuery,
      addEventListener: (
        event: string,
        listener: (event: { key: string | null }) => void
      ) => {
        if (event === 'storage') {
          storageListeners.push(listener);
        }
      },
    },
    document: {
      documentElement: root,
    },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
  };

  vm.runInNewContext(getThemeBootstrapScript(), context);

  return {
    root,
    storage,
    fireMediaChange: (nextPrefersDark: boolean) => {
      mediaQuery.matches = nextPrefersDark;
      mediaChangeListener?.();
    },
    fireStorageChange: (key: string | null) => {
      for (const listener of storageListeners) {
        listener({ key });
      }
    },
  };
}

describe('theme utilities', () => {
  it('resolves system preference against the current OS theme', () => {
    expect(resolveThemePreference('system', true)).toBe('dark');
    expect(resolveThemePreference('system', false)).toBe('light');
    expect(resolveThemePreference('dark', false)).toBe('dark');
    expect(resolveThemePreference('light', true)).toBe('light');
  });

  it('bootstraps the default system theme without persisted preference', () => {
    const runtime = createThemeRuntime({ prefersDark: false });

    expect(runtime.root.dataset.themePreference).toBe('system');
    expect(runtime.root.dataset.theme).toBe('light');
  });

  it('updates the resolved theme when the OS scheme changes in system mode', () => {
    const runtime = createThemeRuntime({ prefersDark: false });

    runtime.fireMediaChange(true);
    expect(runtime.root.dataset.themePreference).toBe('system');
    expect(runtime.root.dataset.theme).toBe('dark');

    runtime.fireMediaChange(false);
    expect(runtime.root.dataset.theme).toBe('light');
  });

  it('ignores OS changes when an explicit preference is stored', () => {
    const runtime = createThemeRuntime({
      prefersDark: false,
      storedPreference: 'light',
    });

    runtime.fireMediaChange(true);

    expect(runtime.root.dataset.themePreference).toBe('light');
    expect(runtime.root.dataset.theme).toBe('light');
  });

  it('reacts to storage updates pushed from another tab', () => {
    const runtime = createThemeRuntime({ prefersDark: false });

    runtime.storage.set(THEME_STORAGE_KEY, 'dark');
    runtime.fireStorageChange(THEME_STORAGE_KEY);

    expect(runtime.root.dataset.themePreference).toBe('dark');
    expect(runtime.root.dataset.theme).toBe('dark');
  });
});
