import React, { useRef, useEffect } from 'react';
import { Platform, SafeAreaView, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import {
  BridgeHandler,
  handleRequestMicPermission,
  handlePlayClick,
  handleVibrate,
} from './bridge';
import { nativeAudioService } from './services/native-audio.service';
import {
  DEV_MACHINE_IP,
  DEV_SERVER_PORT,
  PROD_WEB_URL,
  ANDROID_EMULATOR_HOST,
} from './config.generated';

const DEBUG_TUNER_LATENCY = __DEV__;

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
    bridge.registerHandler('START_LISTENING', async () => {
      nativeAudioService.start(
        (pitchData) => {
          const bridgeSentAtMs = Date.now();
          if (DEBUG_TUNER_LATENCY && typeof pitchData.detectedAtMs === 'number') {
            const nativeToBridgeMs = bridgeSentAtMs - pitchData.detectedAtMs;
            console.info(
              `[tuner-latency:native->bridge] ${nativeToBridgeMs}ms seq=${pitchData.debugSeq ?? '-'} note=${pitchData.name}${pitchData.octave}`,
            );
          }

          bridge.sendToWebView({
            type: 'PITCH_DETECTED',
            data: {
              frequency: pitchData.frequency,
              name: pitchData.name,
              octave: pitchData.octave,
              cents: pitchData.cents,
              confidence: pitchData.confidence ?? pitchData.probability,
              detectedAtMs: pitchData.detectedAtMs,
              bridgeSentAtMs,
              debugSource: pitchData.debugSource ?? 'native',
              debugSeq: pitchData.debugSeq,
            },
          });
        },
        (error) => {
          bridge.sendToWebView({
            type: 'ERROR',
            error,
          });
        },
      );
      return { success: true };
    });
    bridge.registerHandler('STOP_LISTENING', async () => {
      nativeAudioService.stop();
      return { success: true };
    });
    bridge.registerHandler('PLAY_CLICK', handlePlayClick);
    bridge.registerHandler('VIBRATE', handleVibrate);
    bridgeRef.current = bridge;

    return () => {
      nativeAudioService.stop();
      bridge.dispose();
    };
  }, []);

  const handleMessage = (event: WebViewMessageEvent) => {
    bridgeRef.current?.handleMessage(event.nativeEvent.data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        onMessage={handleMessage}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
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
