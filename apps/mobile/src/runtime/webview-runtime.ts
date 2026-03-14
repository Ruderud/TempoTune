export type AppRuntimeChannel = 'development' | 'qa' | 'production';
export type MobilePlatformOs = 'ios' | 'android';
export type NativeDistributionChannel =
  | 'development'
  | 'simulator'
  | 'testflight'
  | 'appstore'
  | 'unknown';

export type MobileWebViewRuntimeOptions = {
  isDevMode: boolean;
  runtimeChannel: AppRuntimeChannel;
  platformOs: MobilePlatformOs;
  devMachineIp: string;
  devServerPort: number;
  prodWebUrl: string;
  androidEmulatorHost: string;
  qaUseDevWebUrl: boolean;
  qaEnableWebviewDebugging: boolean;
  qaWebUrl: string;
  appEntryPath?: string;
  nativeDistributionChannel?: NativeDistributionChannel;
};

export type MobileWebViewRuntime = {
  appEntryPath: string;
  webUrl: string;
  webOrigin: string | null;
  webviewDebuggingEnabled: boolean;
  showQaDebugBanner: boolean;
  shouldLogWebviewEvents: boolean;
};

export const DEFAULT_APP_ENTRY_PATH = '/metronome';

export function ensureAppEntryPath(
  rawUrl: string,
  appEntryPath = DEFAULT_APP_ENTRY_PATH,
): string {
  try {
    const url = new URL(rawUrl);

    if (url.pathname === '' || url.pathname === '/') {
      url.pathname = appEntryPath;
    }

    return url.toString();
  } catch {
    if (rawUrl.endsWith('/')) {
      return `${rawUrl.slice(0, -1)}${appEntryPath}`;
    }

    if (rawUrl.includes('://') && !rawUrl.slice(rawUrl.indexOf('://') + 3).includes('/')) {
      return `${rawUrl}${appEntryPath}`;
    }

    return rawUrl;
  }
}

export function getWebOrigin(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
}

export function buildNativeAppBootstrapUrl(
  rawUrl: string,
  appEntryPath = DEFAULT_APP_ENTRY_PATH,
): string {
  try {
    const sourceUrl = new URL(rawUrl);
    const bootstrapUrl = new URL(sourceUrl.origin);
    bootstrapUrl.searchParams.set('nativeApp', '1');
    bootstrapUrl.searchParams.set('appEntryPath', appEntryPath);
    return bootstrapUrl.toString();
  } catch {
    return ensureAppEntryPath(rawUrl, appEntryPath);
  }
}

function getDevWebUrl(
  platformOs: MobilePlatformOs,
  devMachineIp: string,
  devServerPort: number,
  androidEmulatorHost: string,
  appEntryPath: string,
): string {
  if (platformOs === 'ios') {
    return ensureAppEntryPath(`http://${devMachineIp}:${devServerPort}`, appEntryPath);
  }

  return ensureAppEntryPath(`http://${androidEmulatorHost}:${devServerPort}`, appEntryPath);
}

export function shouldForceProductionRuntime(
  options: Pick<
    MobileWebViewRuntimeOptions,
    'platformOs' | 'nativeDistributionChannel'
  >,
): boolean {
  if (options.platformOs !== 'ios') {
    return false;
  }

  return (
    options.nativeDistributionChannel === 'testflight' ||
    options.nativeDistributionChannel === 'appstore'
  );
}

export function createMobileWebViewRuntime(
  options: MobileWebViewRuntimeOptions,
): MobileWebViewRuntime {
  const appEntryPath = options.appEntryPath ?? DEFAULT_APP_ENTRY_PATH;
  const forceProductionRuntime = shouldForceProductionRuntime(options);
  const isQaRuntime = !forceProductionRuntime && options.runtimeChannel === 'qa';
  const isProductionRuntime =
    forceProductionRuntime || options.runtimeChannel === 'production';

  let webUrl: string;
  if (isQaRuntime && options.qaWebUrl) {
    webUrl = ensureAppEntryPath(options.qaWebUrl, appEntryPath);
  } else if (isProductionRuntime) {
    webUrl = ensureAppEntryPath(options.prodWebUrl, appEntryPath);
  } else if (!options.isDevMode && !options.qaUseDevWebUrl) {
    webUrl = ensureAppEntryPath(options.prodWebUrl, appEntryPath);
  } else {
    webUrl = getDevWebUrl(
      options.platformOs,
      options.devMachineIp,
      options.devServerPort,
      options.androidEmulatorHost,
      appEntryPath,
    );
  }

  return {
    appEntryPath,
    webUrl,
    webOrigin: getWebOrigin(webUrl),
    webviewDebuggingEnabled:
      !forceProductionRuntime &&
      (options.isDevMode || (isQaRuntime && options.qaEnableWebviewDebugging)),
    showQaDebugBanner:
      !forceProductionRuntime &&
      (options.isDevMode ||
        (isQaRuntime &&
          (options.qaEnableWebviewDebugging || Boolean(options.qaWebUrl)))),
    shouldLogWebviewEvents:
      !forceProductionRuntime &&
      (options.isDevMode || (isQaRuntime && options.qaEnableWebviewDebugging)),
  };
}
