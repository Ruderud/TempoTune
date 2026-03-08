import { test, expect } from '@playwright/test';

test.describe('Tab Navigation', () => {
  test('default route loads metronome page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/metronome|\/$/);
    await expect(page.getByTestId('tab-bar-mobile')).toBeVisible();
  });

  test('navigate to tuner tab', async ({ page }) => {
    await page.goto('/metronome');
    await page.getByTestId('tab-tuner').click();
    await expect(page).toHaveURL(/\/tuner/);
    await expect(page.getByTestId('tuner-play-stop').first()).toBeVisible();
  });

  test('navigate to settings tab', async ({ page }) => {
    await page.goto('/metronome');
    await page.getByTestId('tab-settings').click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('navigate back to metronome tab', async ({ page }) => {
    await page.goto('/tuner');
    await page.getByTestId('tab-metronome').click();
    await expect(page).toHaveURL(/\/metronome/);
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
