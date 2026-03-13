import { test, expect } from '@playwright/test';

test.describe('Tab Navigation', () => {
  test('default route loads metronome page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/metronome|\/$/);
    await expect(page.getByTestId('tab-bar-mobile')).toBeVisible();
  });

  test('navigate to tuner tab', async ({ page }) => {
    await page.goto('/metronome');
    const tunerTab = page.locator('[data-testid="tab-tuner"]:visible');
    await expect(tunerTab).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/tuner/),
      tunerTab.click(),
    ]);
    await expect(page.getByTestId('tuner-play-stop').first()).toBeVisible();
  });

  test('navigate to settings tab', async ({ page }) => {
    await page.goto('/metronome');
    const settingsTab = page.locator('[data-testid="tab-settings"]:visible');
    await expect(settingsTab).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/settings/),
      settingsTab.click(),
    ]);
  });

  test('navigate back to metronome tab', async ({ page }) => {
    await page.goto('/tuner');
    const metronomeTab = page.locator('[data-testid="tab-metronome"]:visible');
    await expect(metronomeTab).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/metronome/),
      metronomeTab.click(),
    ]);
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
