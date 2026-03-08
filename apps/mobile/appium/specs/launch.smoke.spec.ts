/**
 * launch.smoke.spec.ts
 * Verifies the app launches successfully on device/simulator.
 */
describe('App Launch', () => {
  it('should launch the app', async () => {
    // App should be running after session creation
    const status = await driver.status();
    expect(status).toBeDefined();
  });

  it('should have at least NATIVE_APP context', async () => {
    const contexts = await driver.getContexts();
    expect(contexts).toContain('NATIVE_APP');
  });

  it('should find app activity or main view', async () => {
    // Give the app time to initialize
    await driver.pause(3000);

    if (driver.isAndroid) {
      const activity = await driver.getCurrentActivity();
      expect(activity).toBeTruthy();
    }

    if (driver.isIOS) {
      // On iOS, verify the app is in foreground
      const state = await driver.execute('mobile: queryAppState', {
        bundleId: 'com.rud.tempotune',
      });
      // 4 = running in foreground
      expect(state).toBe(4);
    }
  });
});
