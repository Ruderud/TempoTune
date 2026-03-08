import { test, expect } from '@playwright/test';

test.describe('Tuner Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tuner');
  });

  test('tuner page loads with controls', async ({ page }) => {
    await expect(page.getByTestId('tuner-play-stop').first()).toBeVisible();
    await expect(page.getByTestId('tuner-preset-select').first()).toBeVisible();
    await expect(page.getByTestId('tuner-mode-auto').first()).toBeVisible();
    await expect(page.getByTestId('tuner-mode-manual').first()).toBeVisible();
  });

  test('preset selector has options', async ({ page }) => {
    const select = page.getByTestId('tuner-preset-select').first();
    const options = select.locator('option');
    expect(await options.count()).toBeGreaterThanOrEqual(2);
  });

  test('mode toggle switches between auto and manual', async ({ page }) => {
    await page.getByTestId('tuner-mode-manual').first().click();
    await expect(page.getByText('수동 모드 활성').first()).toBeVisible();

    await page.getByTestId('tuner-mode-auto').first().click();
    await expect(page.getByText('수동 모드 활성')).not.toBeVisible();
  });
});
