import React, { useRef, useEffect, useState } from 'react';
import { NativeModules, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import type {
  WebViewMessageEvent,
} from 'react-native-webview';
import {
  BridgeHandler,
  handleRequestMicPermission,
  handlePlayClick,
  handleVibrate,
} from './bridge';
import { nativeAudioService } from './services/native-audio.service';
import { nativeMetronomeService } from './services/native-metronome.service';
import { nativeAudioInputService } from './services/native-audio-input.service';
import {
  APP_RUNTIME_CHANNEL,
  DEV_MACHINE_IP,
  DEV_SERVER_PORT,
  PROD_WEB_URL,
  ANDROID_EMULATOR_HOST,
  QA_USE_DEV_WEB_URL,
  QA_ENABLE_WEBVIEW_DEBUGGING,
  QA_WEB_URL,
} from './config.generated';
import {
  buildNativeAppBootstrapUrl,
  createMobileWebViewRuntime,
  type AppRuntimeChannel,
  type NativeDistributionChannel,
} from './runtime/webview-runtime';

const DEBUG_TUNER_LATENCY = __DEV__;
const RUNTIME_CHANNEL = APP_RUNTIME_CHANNEL as AppRuntimeChannel;
const NATIVE_DISTRIBUTION_CHANNEL = (
  NativeModules.AppRuntimeInfoModule?.distributionChannel ?? 'unknown'
) as NativeDistributionChannel;
const WEBVIEW_RUNTIME = createMobileWebViewRuntime({
  isDevMode: __DEV__,
  runtimeChannel: RUNTIME_CHANNEL,
  platformOs: Platform.OS === 'android' ? 'android' : 'ios',
  devMachineIp: DEV_MACHINE_IP,
  devServerPort: DEV_SERVER_PORT,
  prodWebUrl: PROD_WEB_URL,
  androidEmulatorHost: ANDROID_EMULATOR_HOST,
  qaUseDevWebUrl: QA_USE_DEV_WEB_URL,
  qaEnableWebviewDebugging: QA_ENABLE_WEBVIEW_DEBUGGING,
  qaWebUrl: QA_WEB_URL,
  nativeDistributionChannel: NATIVE_DISTRIBUTION_CHANNEL,
});
const APP_ENTRY_PATH = WEBVIEW_RUNTIME.appEntryPath;
const WEB_URL = buildNativeAppBootstrapUrl(WEBVIEW_RUNTIME.webUrl, APP_ENTRY_PATH);
const WEBVIEW_DEBUGGING_ENABLED = WEBVIEW_RUNTIME.webviewDebuggingEnabled;
const SHOW_QA_DEBUG_BANNER = WEBVIEW_RUNTIME.showQaDebugBanner;
const SHOULD_LOG_WEBVIEW_EVENTS = WEBVIEW_RUNTIME.shouldLogWebviewEvents;
const WEBVIEW_NATIVE_MARKER_SCRIPT = `
  window.__TEMPO_TUNE_NATIVE_WEBVIEW__ = true;
  window.__TEMPO_TUNE_APP_ENTRY_PATH__ = ${JSON.stringify(APP_ENTRY_PATH)};
  true;
`;

function App(): React.JSX.Element {
  const webViewRef = useRef<WebView | null>(null);
  const bridgeRef = useRef<BridgeHandler | null>(null);
  const currentWebUrl = WEB_URL;
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

    // Audio input infrastructure handlers
    bridge.registerHandler('LIST_AUDIO_INPUT_DEVICES', async () => {
      const devices = await nativeAudioInputService.listInputDevices();
      bridge.sendToWebView({
        type: 'AUDIO_INPUT_DEVICES_RESPONSE',
        data: { devices },
      });
      return { success: true };
    });

    bridge.registerHandler('GET_SELECTED_AUDIO_INPUT_DEVICE', async () => {
      const device = await nativeAudioInputService.getSelectedInputDevice();
      bridge.sendToWebView({
        type: 'SELECTED_AUDIO_INPUT_DEVICE_RESPONSE',
        data: { device },
      });
      return { success: true };
    });

    bridge.registerHandler('SELECT_AUDIO_INPUT_DEVICE', async (data) => {
      const { deviceId } = data as { deviceId: string };
      nativeAudioInputService.selectInputDevice(deviceId);
      return { success: true };
    });

    bridge.registerHandler('START_AUDIO_CAPTURE', async (data) => {
      const config = data as import('@tempo-tune/shared/types').AudioCaptureConfig;
      nativeAudioInputService.startCapture(config);
      return { success: true };
    });

    bridge.registerHandler('STOP_AUDIO_CAPTURE', async () => {
      nativeAudioInputService.stopCapture();
      return { success: true };
    });

    bridge.registerHandler('CONFIGURE_AUDIO_ANALYZERS', async (data) => {
      const config = data as { enablePitch: boolean; enableRhythm: boolean };
      nativeAudioInputService.configureAnalyzers(config);
      return { success: true };
    });

    bridge.registerHandler('SET_QA_AUDIO_SAMPLE_SOURCE', async (data) => {
      const config = data as { url: string; loop?: boolean };
      nativeAudioInputService.setQaSampleSource(config);
      return { success: true };
    });

    bridge.registerHandler('CLEAR_QA_AUDIO_SAMPLE_SOURCE', async () => {
      nativeAudioInputService.clearQaSampleSource();
      return { success: true };
    });

    // Forward native audio input events to WebView
    const unsubInputState = nativeAudioInputService.onStateChanged((state) => {
      bridge.sendToWebView({ type: 'AUDIO_INPUT_STATE_CHANGED', data: state });
    });

    const unsubInputPitch = nativeAudioInputService.onPitchDetected((event) => {
      bridge.sendToWebView({ type: 'PITCH_DETECTED', data: event });
    });

    const unsubInputRhythm = nativeAudioInputService.onRhythmDetected((event) => {
      bridge.sendToWebView({ type: 'RHYTHM_HIT_DETECTED', data: event });
    });

    const unsubInputRoute = nativeAudioInputService.onRouteChanged((devices) => {
      bridge.sendToWebView({ type: 'AUDIO_INPUT_ROUTE_CHANGED', data: { devices } });
    });

    const unsubInputError = nativeAudioInputService.onError((errorMessage) => {
      bridge.sendToWebView({ type: 'ERROR', error: errorMessage });
    });

    bridgeRef.current = bridge;

    return () => {
      nativeAudioService.stop();
      nativeMetronomeService.stop();
      nativeAudioInputService.stopCapture();
      nativeAudioInputService.clearQaSampleSource();
      unsubInputState();
      unsubInputPitch();
      unsubInputRhythm();
      unsubInputRoute();
      unsubInputError();
      bridge.dispose();
    };
  }, []);

  const handleMessage = (event: WebViewMessageEvent) => {
    bridgeRef.current?.handleMessage(event.nativeEvent.data);
  };

  const handleShouldStartLoadWithRequest = () => true;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: currentWebUrl }}
        injectedJavaScriptBeforeContentLoaded={WEBVIEW_NATIVE_MARKER_SCRIPT}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
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
