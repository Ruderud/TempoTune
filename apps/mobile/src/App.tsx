import React, { useRef, useEffect, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import {
  BridgeHandler,
  handleRequestMicPermission,
  handlePlayClick,
  handleVibrate,
} from './bridge';
import { nativeAudioService } from './services/native-audio.service';
import { nativeMetronomeService } from './services/native-metronome.service';
import {
  DEV_MACHINE_IP,
  DEV_SERVER_PORT,
  PROD_WEB_URL,
  ANDROID_EMULATOR_HOST,
  QA_USE_DEV_WEB_URL,
  QA_ENABLE_WEBVIEW_DEBUGGING,
  QA_WEB_URL,
} from './config.generated';

const DEBUG_TUNER_LATENCY = __DEV__;
const WEBVIEW_DEBUGGING_ENABLED = __DEV__ || QA_ENABLE_WEBVIEW_DEBUGGING;
const SHOW_QA_DEBUG_BANNER = WEBVIEW_DEBUGGING_ENABLED || Boolean(QA_WEB_URL);
const SHOULD_LOG_WEBVIEW_EVENTS = WEBVIEW_DEBUGGING_ENABLED;

const getDevWebUrl = (): string => {
  if (Platform.OS === 'ios') {
    return `http://${DEV_MACHINE_IP}:${DEV_SERVER_PORT}`;
  }

  return `http://${ANDROID_EMULATOR_HOST}:${DEV_SERVER_PORT}`;
};

const getWebUrl = (): string => {
  if (QA_WEB_URL) {
    return QA_WEB_URL;
  }

  if (!__DEV__ && !QA_USE_DEV_WEB_URL) {
    return PROD_WEB_URL;
  }

  return getDevWebUrl();
};

const WEB_URL = getWebUrl();

function App(): React.JSX.Element {
  const webViewRef = useRef<WebView | null>(null);
  const bridgeRef = useRef<BridgeHandler | null>(null);
  const [webViewStatus, setWebViewStatus] = useState('idle');
  const [webViewEventUrl, setWebViewEventUrl] = useState(WEB_URL);

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
          if (
            DEBUG_TUNER_LATENCY &&
            typeof pitchData.detectedAtMs === 'number'
          ) {
            const nativeToBridgeMs = bridgeSentAtMs - pitchData.detectedAtMs;
            console.info(
              `[tuner-latency:native->bridge] ${nativeToBridgeMs}ms seq=${pitchData.debugSeq ?? '-'} note=${pitchData.name}${pitchData.octave}`
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
        }
      );
      return { success: true };
    });
    bridge.registerHandler('STOP_LISTENING', async () => {
      nativeAudioService.stop();
      return { success: true };
    });
    bridge.registerHandler('PLAY_CLICK', handlePlayClick);
    bridge.registerHandler('VIBRATE', handleVibrate);

    // Native metronome handlers
    bridge.registerHandler('START_NATIVE_METRONOME', async (data) => {
      const { bpm, beatsPerMeasure, accentFirst } = data as {
        bpm: number;
        beatsPerMeasure: number;
        accentFirst: boolean;
      };
      nativeMetronomeService.start(
        bpm,
        beatsPerMeasure,
        accentFirst,
        (tickData) => {
          bridge.sendToWebView({
            type: 'NATIVE_METRONOME_TICK',
            data: tickData,
          });
        },
        (stateData) => {
          bridge.sendToWebView({
            type: 'NATIVE_METRONOME_STATE',
            data: stateData,
          });
        }
      );
      return { success: true };
    });

    bridge.registerHandler('STOP_NATIVE_METRONOME', async () => {
      nativeMetronomeService.stop();
      return { success: true };
    });

    bridge.registerHandler('SET_METRONOME_BPM', async (data) => {
      const { bpm } = data as { bpm: number };
      nativeMetronomeService.setBpm(bpm);
      return { success: true };
    });

    bridge.registerHandler('SET_METRONOME_TIME_SIG', async (data) => {
      const { beatsPerMeasure } = data as { beatsPerMeasure: number };
      nativeMetronomeService.setTimeSignature(beatsPerMeasure);
      return { success: true };
    });

    bridgeRef.current = bridge;

    return () => {
      nativeAudioService.stop();
      nativeMetronomeService.stop();
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
        testID="app-webview"
        style={styles.webview}
        webviewDebuggingEnabled={WEBVIEW_DEBUGGING_ENABLED}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        javaScriptEnabled
        onLoadStart={(event) => {
          setWebViewStatus('load-start');
          setWebViewEventUrl(event.nativeEvent.url);
          if (SHOULD_LOG_WEBVIEW_EVENTS) {
            console.info(`[webview] load-start ${event.nativeEvent.url}`);
          }
        }}
        onLoadEnd={(event) => {
          setWebViewStatus('load-end');
          setWebViewEventUrl(event.nativeEvent.url);
          if (SHOULD_LOG_WEBVIEW_EVENTS) {
            console.info(`[webview] load-end ${event.nativeEvent.url}`);
          }
        }}
        onHttpError={(event) => {
          setWebViewStatus(`http-error:${event.nativeEvent.statusCode}`);
          setWebViewEventUrl(event.nativeEvent.url);
          console.error(
            `[webview] http-error ${event.nativeEvent.statusCode} ${event.nativeEvent.description}`
          );
        }}
        onError={(event) => {
          setWebViewStatus(`load-error:${event.nativeEvent.code}`);
          setWebViewEventUrl(event.nativeEvent.url);
          console.error(
            `[webview] load-error ${event.nativeEvent.code} ${event.nativeEvent.description}`
          );
        }}
      />
      {SHOW_QA_DEBUG_BANNER ? (
        <View style={styles.qaBanner}>
          <Text
            accessibilityLabel={`QA URL ${WEB_URL}`}
            selectable
            style={styles.qaBannerText}
            testID="qa-web-url-banner"
          >
            {WEB_URL}
          </Text>
          <Text
            accessibilityLabel={`QA WebView Status ${webViewStatus} ${webViewEventUrl}`}
            selectable
            style={styles.qaBannerMetaText}
            testID="qa-webview-status"
          >
            {webViewStatus} {webViewEventUrl}
          </Text>
        </View>
      ) : null}
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
  qaBanner: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  qaBannerText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Platform.select({
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
  qaBannerMetaText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 10,
    marginTop: 4,
    fontFamily: Platform.select({
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
});

export default App;
