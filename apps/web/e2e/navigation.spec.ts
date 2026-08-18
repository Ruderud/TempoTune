import { test, expect } from '@playwright/test';

const LAST_APP_ROUTE_COOKIE_KEY = 'tempo_last_app_route_v1';

test.describe('Tab Navigation', () => {
  test('default route loads landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: /박자와 음정에,?\s*바로 집중하세요/i })
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
      page.getByRole('heading', { name: /박자와 음정에,?\s*바로 집중하세요/i })
    ).toBeVisible();
  });

  test('landing exposes only real product routes and verified proof points', async ({
    page,
  }) => {
    await page.goto('/landing');

    await expect(
      page.getByRole('link', { name: '메트로놈 열기' }).first()
    ).toHaveAttribute('href', '/metronome');
    await expect(
      page.getByRole('link', { name: '튜너 열기' }).first()
    ).toHaveAttribute('href', '/tuner');
    await expect(page.getByText('35–1400 Hz')).toBeVisible();
    await expect(page.getByText('±5 cents')).toBeVisible();
    await expect(page.getByText('전 세계 100만 명')).toHaveCount(0);
    await expect(page.getByText('클라우드 동기화')).toHaveCount(0);
    await expect(page.getByText('App Store')).toHaveCount(0);

    const layout = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(layout.scrollHeight).toBeGreaterThan(layout.viewportHeight);
    expect(layout.scrollWidth).toBe(layout.viewportWidth);
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

  test('all four tabs are visible in mobile nav', async ({ page }) => {
    await page.goto('/metronome');
    const nav = page.getByTestId('tab-bar-mobile');
    await expect(nav.getByTestId('tab-metronome')).toBeVisible();
    await expect(nav.getByTestId('tab-tuner')).toBeVisible();
    await expect(nav.getByTestId('tab-rhythm')).toBeVisible();
    await expect(nav.getByTestId('tab-settings')).toBeVisible();
  });
});
