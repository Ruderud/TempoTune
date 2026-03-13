import { expect, test } from '@playwright/test';

test.describe('Theme Mode', () => {
  test('theme menu applies explicit light and dark themes', async ({ page }) => {
    await page.goto('/tuner');
    await expect(page.getByTestId('tuner-play-stop').first()).toBeVisible();

    const html = page.locator('html');
    const themeTrigger = page.locator('[data-testid="theme-menu-trigger"]:visible');

    await themeTrigger.click();
    await page.getByTestId('theme-option-light').click();

    await expect(html).toHaveAttribute('data-theme-preference', 'light');
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem('tempo_theme_preference_v1'))
      )
      .toBe('light');

    await themeTrigger.click();
    await page.getByTestId('theme-option-dark').click();

    await expect(html).toHaveAttribute('data-theme-preference', 'dark');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem('tempo_theme_preference_v1'))
      )
      .toBe('dark');
  });

  test('system theme follows prefers-color-scheme changes on landing', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/landing');
    await expect(
      page.getByRole('heading', { name: /음악의 완벽한 템포,?\s*TempoTune/i })
    ).toBeVisible();

    await page.evaluate(() => {
      localStorage.removeItem('tempo_theme_preference_v1');
    });
    await page.reload();

    const html = page.locator('html');

    await expect(html).toHaveAttribute('data-theme-preference', 'system');
    await expect(html).toHaveAttribute('data-theme', 'light');

    await page.emulateMedia({ colorScheme: 'dark' });

    await expect
      .poll(() =>
        page.evaluate(() => ({
          preference: document.documentElement.dataset.themePreference,
          theme: document.documentElement.dataset.theme,
        }))
      )
      .toEqual({
        preference: 'system',
        theme: 'dark',
      });
  });
});
