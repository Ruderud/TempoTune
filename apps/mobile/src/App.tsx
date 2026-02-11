import React, { useRef, useEffect } from 'react';
import { Platform, SafeAreaView, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import {
  BridgeHandler,
  handleRequestMicPermission,
  handleStartListening,
  handleStopListening,
  handlePlayClick,
  handleVibrate,
} from './bridge';
import {
  DEV_MACHINE_IP,
  DEV_SERVER_PORT,
  PROD_WEB_URL,
  ANDROID_EMULATOR_HOST,
} from './config.generated';

const getWebUrl = (): string => {
  if (!__DEV__) {
    return PROD_WEB_URL;
  }

  if (Platform.OS === 'ios') {
    return `http://${DEV_MACHINE_IP}:${DEV_SERVER_PORT}`;
  } else {
    return `http://${ANDROID_EMULATOR_HOST}:${DEV_SERVER_PORT}`;
  }
};

const WEB_URL = getWebUrl();

function App(): React.JSX.Element {
  const webViewRef = useRef<WebView | null>(null);
  const bridgeRef = useRef<BridgeHandler | null>(null);

  useEffect(() => {
    const bridge = new BridgeHandler(webViewRef);
    bridge.registerHandler(
      'REQUEST_MIC_PERMISSION',
      handleRequestMicPermission
    );
    bridge.registerHandler('START_LISTENING', handleStartListening);
    bridge.registerHandler('STOP_LISTENING', handleStopListening);
    bridge.registerHandler('PLAY_CLICK', handlePlayClick);
    bridge.registerHandler('VIBRATE', handleVibrate);
    bridgeRef.current = bridge;

    return () => {
      bridge.dispose();
    };
  }, []);

  const handleMessage = (event: WebViewMessageEvent) => {
    bridgeRef.current?.handleMessage(event.nativeEvent.data);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* @ts-expect-error react-native-webview types incompatible with React 19 */}
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        onMessage={handleMessage}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});

export default App;
