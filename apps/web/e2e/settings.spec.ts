import { test, expect, type Locator } from '@playwright/test';

async function setRangeValue(locator: Locator, value: number) {
  await locator.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;
    valueSetter?.call(input, String(nextValue));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test.describe('Settings Page', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    // Settings page should render without errors
    await expect(page.getByTestId('tab-bar-mobile')).toBeVisible();
  });

  test('navigable from metronome', async ({ page }) => {
    await page.goto('/metronome');
    const settingsTab = page.locator('[data-testid="tab-settings"]:visible');
    await expect(settingsTab).toBeVisible();
    await Promise.all([page.waitForURL(/\/settings/), settingsTab.click()]);
  });

  test('persists tuner and metronome preferences after reload', async ({
    page,
  }) => {
    await page.goto('/settings');

    await setRangeValue(page.getByLabel('A4 기준 주파수'), 444);
    await page.getByRole('button', { name: '빠른 응답' }).click();
    await setRangeValue(page.getByLabel('기본 BPM'), 180);
    await page.getByRole('button', { name: '6/8' }).click();

    await page.reload();

    await expect(page.getByLabel('A4 기준 주파수')).toHaveValue('444');
    await expect(
      page.getByRole('button', { name: '빠른 응답' })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('기본 BPM')).toHaveValue('180');
    await expect(page.getByRole('button', { name: '6/8' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
