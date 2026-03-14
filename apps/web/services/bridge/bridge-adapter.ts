export function isNativeEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const nativeWindow = window as typeof window & {
    __TEMPO_TUNE_NATIVE_WEBVIEW__?: boolean;
  };

  return (
    'ReactNativeWebView' in window ||
    nativeWindow.__TEMPO_TUNE_NATIVE_WEBVIEW__ === true
  );
}

export function postMessageToNative<T>(message: T): void {
  if (isNativeEnvironment()) {
    (window as unknown as { ReactNativeWebView: { postMessage: (msg: string) => void } })
      .ReactNativeWebView.postMessage(JSON.stringify(message));
  }
}

export function addNativeMessageListener(callback: (data: unknown) => void): () => void {
  const handler = (event: MessageEvent) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      callback(data);
    } catch {
      // JSON parse 실패 시 무시
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}
