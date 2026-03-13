export const THEME_STORAGE_KEY = 'tempo_theme_preference_v1';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveThemePreference(
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light';
  }

  return preference;
}

export function getThemeBootstrapScript(): string {
  return `
    (() => {
      const storageKey = '${THEME_STORAGE_KEY}';
      const root = document.documentElement;
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const stored = localStorage.getItem(storageKey);
      const preference = stored === 'light' || stored === 'dark' ? stored : 'system';
      const resolved = preference === 'system'
        ? (mediaQuery.matches ? 'dark' : 'light')
        : preference;

      root.dataset.themePreference = preference;
      root.dataset.theme = resolved;
    })();
  `;
}
