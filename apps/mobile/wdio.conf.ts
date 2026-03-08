import type { Options } from '@wdio/types';
import { resolve } from 'node:path';
import { loadQaEnv } from '../../scripts/qa/load-qa-env';

loadQaEnv();

const APPIUM_HOME = resolve(__dirname, '../../.appium');
const DEFAULT_IOS_BUNDLE_ID = 'com.rud.tempotune';

const baseCapabilities = {
  'appium:noReset': true,
  'appium:fullReset': false,
  'appium:newCommandTimeout': 240,
};

// Dynamic capabilities based on environment
function getCapabilities(): WebdriverIO.Capabilities[] {
  const platform = process.env.QA_PLATFORM || 'all';
  const caps: WebdriverIO.Capabilities[] = [];

  if (platform === 'android' || platform === 'all') {
    caps.push({
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:app':
        process.env.QA_ANDROID_APK ||
        resolve(__dirname, 'android/app/build/outputs/apk/debug/app-debug.apk'),
      'appium:systemPort': Number(process.env.QA_SYSTEM_PORT) || 8200,
      'appium:chromedriverPort':
        Number(process.env.QA_CHROMEDRIVER_PORT) || 9515,
      ...baseCapabilities,
    });
  }

  if (platform === 'ios' || platform === 'all') {
    const iosBundleId = process.env.QA_IOS_BUNDLE_ID;
    const deviceMode = process.env.QA_DEVICE_MODE || 'all';
    const isConnectedRealDevice = deviceMode === 'connected';
    const xcodeOrgId =
      process.env.QA_IOS_XCODE_ORG_ID || process.env.QA_IOS_TEAM_ID;
    const xcodeSigningId =
      process.env.QA_IOS_XCODE_SIGNING_ID ||
      process.env.QA_IOS_SIGNING_ID ||
      'Apple Development';
    const platformVersion = process.env.QA_DEVICE_OS_VERSION;
    const useNewWda =
      process.env.QA_IOS_USE_NEW_WDA === '1' ||
      process.env.QA_IOS_USE_NEW_WDA === 'true';
    const updatedWdaBundleId =
      process.env.QA_IOS_UPDATED_WDA_BUNDLE_ID ||
      process.env.QA_IOS_WDA_BUNDLE_ID ||
      `${iosBundleId || DEFAULT_IOS_BUNDLE_ID}.wda`;
    caps.push({
      platformName: 'iOS',
      ...(platformVersion ? { 'appium:platformVersion': platformVersion } : {}),
      'appium:automationName': 'XCUITest',
      ...(iosBundleId
        ? { 'appium:bundleId': iosBundleId }
        : {
            'appium:app':
              process.env.QA_IOS_APP ||
              resolve(
                __dirname,
                'ios/build/Build/Products/Debug-iphonesimulator/TempoTune.app'
              ),
          }),
      'appium:autoAcceptAlerts': true,
      'appium:wdaLocalPort': Number(process.env.QA_WDA_PORT) || 8100,
      'appium:webviewConnectTimeout': 10000,
      ...(isConnectedRealDevice
        ? {
            'appium:showXcodeLog': true,
            'appium:allowProvisioningDeviceRegistration': true,
            'appium:updatedWDABundleId': updatedWdaBundleId,
            ...(useNewWda ? { 'appium:useNewWDA': true } : {}),
            ...(xcodeOrgId ? { 'appium:xcodeOrgId': xcodeOrgId } : {}),
            ...(xcodeSigningId
              ? { 'appium:xcodeSigningId': xcodeSigningId }
              : {}),
          }
        : {}),
      ...baseCapabilities,
    });
  }

  // If specific UDID is provided, add it to all capabilities
  const udid = process.env.QA_DEVICE_UDID;
  if (udid) {
    for (const cap of caps) {
      (cap as Record<string, unknown>)['appium:udid'] = udid;
    }
  }

  return caps;
}

export const config: Options.Testrunner = {
  runner: 'local',
  port: 4723,

  specs: ['./appium/specs/**/*.spec.ts'],
  exclude: [],

  maxInstances: 1,
  capabilities: getCapabilities(),

  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: [
    [
      'appium',
      {
        command: 'appium',
        args: {
          relaxedSecurity: true,
        },
        logPath: './appium-logs',
      },
    ],
  ],

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 180000,
  },

  // Set APPIUM_HOME for driver discovery
  beforeSession: () => {
    process.env.APPIUM_HOME = APPIUM_HOME;
  },
};
