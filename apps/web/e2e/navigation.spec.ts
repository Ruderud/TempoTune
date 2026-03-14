import { test, expect } from '@playwright/test';

const LAST_APP_ROUTE_COOKIE_KEY = 'tempo_last_app_route_v1';

test.describe('Tab Navigation', () => {
  test('default route loads landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: /음악의 완벽한 템포,?\s*TempoTune/i })
    ).toBeVisible();
  });

  test('default route resumes the last visited app screen', async ({
    page,
  }) => {
    await page.goto('/tuner');
    await expect(page.getByTestId('tuner-play-stop').first()).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate((cookieKey) => {
          return document.cookie
            .split('; ')
            .find((entry) => entry.startsWith(`${cookieKey}=`));
        }, LAST_APP_ROUTE_COOKIE_KEY)
      )
      .toContain(`${LAST_APP_ROUTE_COOKIE_KEY}=%2Ftuner`);

    await page.goto('/');
    await expect(page).toHaveURL(/\/tuner$/);
    await expect(page.getByTestId('tuner-play-stop').first()).toBeVisible();
  });

  test('standalone landing route stays on landing page', async ({ page }) => {
    await page.goto('/tuner');
    await expect(page.getByTestId('tuner-play-stop').first()).toBeVisible();

    await page.goto('/landing');
    await expect(page).toHaveURL(/\/landing$/);
    await expect(
      page.getByRole('heading', { name: /음악의 완벽한 템포,?\s*TempoTune/i })
    ).toBeVisible();
  });

  test('navigate to tuner tab', async ({ page }) => {
    await page.goto('/metronome');
    const tunerTab = page.locator('[data-testid="tab-tuner"]:visible');
    await expect(tunerTab).toBeVisible();
    await Promise.all([page.waitForURL(/\/tuner/), tunerTab.click()]);
    await expect(page.getByTestId('tuner-play-stop').first()).toBeVisible();
  });

  test('navigate to settings tab', async ({ page }) => {
    await page.goto('/metronome');
    const settingsTab = page.locator('[data-testid="tab-settings"]:visible');
    await expect(settingsTab).toBeVisible();
    await Promise.all([page.waitForURL(/\/settings/), settingsTab.click()]);
  });

  test('navigate back to metronome tab', async ({ page }) => {
    await page.goto('/tuner');
    const metronomeTab = page.locator('[data-testid="tab-metronome"]:visible');
    await expect(metronomeTab).toBeVisible();
    await Promise.all([page.waitForURL(/\/metronome/), metronomeTab.click()]);
    await expect(page.getByTestId('metronome-play-stop').first()).toBeVisible();
  });

  test('all three tabs are visible in mobile nav', async ({ page }) => {
    await page.goto('/metronome');
    const nav = page.getByTestId('tab-bar-mobile');
    await expect(nav.getByTestId('tab-metronome')).toBeVisible();
    await expect(nav.getByTestId('tab-tuner')).toBeVisible();
    await expect(nav.getByTestId('tab-settings')).toBeVisible();
  });
});
