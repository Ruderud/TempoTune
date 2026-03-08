import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    // Settings page should render without errors
    await expect(page.getByTestId('tab-bar-mobile')).toBeVisible();
  });

  test('navigable from metronome', async ({ page }) => {
    await page.goto('/metronome');
    await page.getByTestId('tab-settings').click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
