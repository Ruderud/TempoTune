/**
 * Best-effort helpers for platform permission/system alerts.
 */

export async function acceptSystemAlertIfPresent(
  driver: WebdriverIO.Browser
): Promise<boolean> {
  try {
    if (await driver.isAlertOpen()) {
      await driver.acceptAlert();
      await driver.pause(1000);
      return true;
    }
  } catch {
    // Fall back to explicit button selectors below.
  }

  const selectors = driver.isIOS
    ? [
        '-ios predicate string:label == "허용" OR name == "허용"',
        '-ios predicate string:label == "Allow" OR name == "Allow"',
        '~허용',
        '~Allow',
        '~OK',
      ]
    : [
        '//*[@resource-id="com.android.permissioncontroller:id/permission_allow_foreground_only_button"]',
        '//*[@resource-id="com.android.permissioncontroller:id/permission_allow_button"]',
      ];

  for (const selector of selectors) {
    try {
      const button = await driver.$(selector);
      if (await button.isDisplayed()) {
        await button.click();
        await driver.pause(1000);
        return true;
      }
    } catch {
      // Ignore missing or stale alert buttons.
    }
  }

  return false;
}
