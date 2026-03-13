import { acceptSystemAlertIfPresent } from '../helpers/alerts';
import { switchToNative, switchToWebView } from '../helpers/contexts';
import { waitForWebViewReady } from '../helpers/wait';

type ThemeState = {
  preference: string | null;
  theme: string | null;
  systemDark: boolean;
};

async function readThemeState(): Promise<ThemeState> {
  return (await driver.execute(() => ({
    preference: document.documentElement.dataset.themePreference ?? null,
    theme: document.documentElement.dataset.theme ?? null,
    systemDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  }))) as ThemeState;
}

async function ensureThemeMenuAvailable() {
  const existingTrigger = await driver.$('[data-testid="theme-menu-trigger"]');
  if (await existingTrigger.isExisting()) {
    return existingTrigger;
  }

  const metronomeTab = await driver.$('[data-testid="tab-metronome"]');
  if (await metronomeTab.isExisting()) {
    await metronomeTab.click();
  }

  const trigger = await driver.$('[data-testid="theme-menu-trigger"]');
  await trigger.waitForDisplayed({ timeout: 10000 });
  return trigger;
}

async function openThemeMenu() {
  const trigger = await ensureThemeMenuAvailable();
  await trigger.click();

  const systemOption = await driver.$('[data-testid="theme-option-system"]');
  await systemOption.waitForDisplayed({ timeout: 10000 });
}

async function selectTheme(preference: 'system' | 'light' | 'dark') {
  await openThemeMenu();

  const option = await driver.$(`[data-testid="theme-option-${preference}"]`);
  await option.click();

  await driver.waitUntil(
    async () => {
      const state = await readThemeState();
      if (state.preference !== preference) {
        return false;
      }

      return preference === 'system' ? true : state.theme === preference;
    },
    {
      timeout: 10000,
      timeoutMsg: `Theme preference did not become ${preference}`,
    }
  );
}

describe('Theme Mode', () => {
  beforeEach(async () => {
    await acceptSystemAlertIfPresent(driver);
    await switchToWebView(driver);
    await waitForWebViewReady(driver);
    await ensureThemeMenuAvailable();
  });

  it('should switch between explicit light and dark themes from the header menu', async () => {
    await selectTheme('light');
    expect(await readThemeState()).toMatchObject({
      preference: 'light',
      theme: 'light',
    });

    await selectTheme('dark');
    expect(await readThemeState()).toMatchObject({
      preference: 'dark',
      theme: 'dark',
    });
  });

  it('should align system theme with the device prefers-color-scheme setting', async () => {
    await selectTheme('system');

    const state = await readThemeState();
    expect(state.preference).toBe('system');
    expect(state.theme).toBe(state.systemDark ? 'dark' : 'light');
  });

  afterEach(async () => {
    try {
      await switchToNative(driver);
    } catch {
      /* already in native */
    }
  });
});
