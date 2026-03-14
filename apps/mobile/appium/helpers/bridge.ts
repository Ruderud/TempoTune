/**
 * WebView bridge helpers for Appium QA flows.
 */

type BridgeEventProbeEntry = {
  type?: string;
  data?: unknown;
  error?: string;
};

export type QaBridgeEvent = BridgeEventProbeEntry;

export async function installBridgeProbe(driver: WebdriverIO.Browser): Promise<void> {
  await driver.execute(() => {
    const qaWindow = window as typeof window & {
      __tempoTuneQaBridgeProbeInstalled?: boolean;
      __tempoTuneQaBridgeEvents?: BridgeEventProbeEntry[];
    };

    if (qaWindow.__tempoTuneQaBridgeProbeInstalled) {
      return;
    }

    qaWindow.__tempoTuneQaBridgeEvents = [];
    window.addEventListener('message', (event) => {
      try {
        const payload =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        qaWindow.__tempoTuneQaBridgeEvents?.push(payload);
        if ((qaWindow.__tempoTuneQaBridgeEvents?.length ?? 0) > 200) {
          qaWindow.__tempoTuneQaBridgeEvents?.splice(0, 50);
        }
      } catch {
        // Ignore non-JSON bridge traffic.
      }
    });
    qaWindow.__tempoTuneQaBridgeProbeInstalled = true;
  });
}

export async function clearBridgeEvents(driver: WebdriverIO.Browser): Promise<void> {
  await driver.execute(() => {
    const qaWindow = window as typeof window & {
      __tempoTuneQaBridgeEvents?: BridgeEventProbeEntry[];
    };
    qaWindow.__tempoTuneQaBridgeEvents = [];
  });
}

export async function getBridgeEventCount(
  driver: WebdriverIO.Browser,
  type: string,
): Promise<number> {
  return await driver.execute((eventType) => {
    const qaWindow = window as typeof window & {
      __tempoTuneQaBridgeEvents?: BridgeEventProbeEntry[];
    };
    return (qaWindow.__tempoTuneQaBridgeEvents ?? []).filter(
      (event) => event?.type === eventType,
    ).length;
  }, type);
}

export async function getBridgeEvents(
  driver: WebdriverIO.Browser,
  type?: string,
): Promise<QaBridgeEvent[]> {
  return await driver.execute((eventType) => {
    const qaWindow = window as typeof window & {
      __tempoTuneQaBridgeEvents?: BridgeEventProbeEntry[];
    };
    const events = qaWindow.__tempoTuneQaBridgeEvents ?? [];
    if (!eventType) {
      return events;
    }

    return events.filter((event) => event?.type === eventType);
  }, type ?? null);
}

export async function getLatestBridgeEvent(
  driver: WebdriverIO.Browser,
  type: string,
): Promise<QaBridgeEvent | null> {
  const events = await getBridgeEvents(driver, type);
  return events.length > 0 ? events[events.length - 1] : null;
}

export async function waitForBridgeEvent(
  driver: WebdriverIO.Browser,
  type: string,
  minimumCount = 1,
  timeout = 15000,
): Promise<void> {
  await driver.waitUntil(
    async () => (await getBridgeEventCount(driver, type)) >= minimumCount,
    {
      timeout,
      timeoutMsg: `Bridge event ${type} was not observed in time`,
      interval: 300,
    },
  );
}

export async function waitForBridgeEventMatching(
  driver: WebdriverIO.Browser,
  type: string,
  predicate: (event: QaBridgeEvent) => boolean,
  timeout = 15000,
): Promise<QaBridgeEvent> {
  let latestMatch: QaBridgeEvent | null = null;

  await driver.waitUntil(
    async () => {
      const events = await getBridgeEvents(driver, type);
      const match = [...events].reverse().find((event) => predicate(event));
      if (!match) {
        return false;
      }

      latestMatch = match;
      return true;
    },
    {
      timeout,
      timeoutMsg: `Bridge event ${type} did not satisfy the expected predicate in time`,
      interval: 300,
    },
  );

  return latestMatch as QaBridgeEvent;
}

export async function postBridgeMessage(
  driver: WebdriverIO.Browser,
  type: string,
  data?: unknown,
): Promise<void> {
  await driver.execute(
    ({messageType, payload}) => {
      const qaWindow = window as typeof window & {
        ReactNativeWebView?: {postMessage: (message: string) => void};
      };
      qaWindow.ReactNativeWebView?.postMessage(
        JSON.stringify({
          type: messageType,
          data: payload,
          requestId: `qa-${Date.now()}`,
        }),
      );
    },
    {
      messageType: type,
      payload: data ?? null,
    },
  );
}

export async function getWebViewOrigin(driver: WebdriverIO.Browser): Promise<string> {
  return await driver.execute(() => window.location.origin);
}
