import { createAudioInputBridge, type AudioInputBridge } from '@tempo-tune/audio-input';
import { createWebAudioInputAdapter } from './web-audio-input.adapter';
import { createNativeBridgeAudioInputAdapter } from './native-bridge-audio-input.adapter';
import { isNativeEnvironment } from '../bridge/bridge-adapter';

let instance: AudioInputBridge | null = null;

/**
 * Get the singleton AudioInputBridge facade.
 * Auto-detects environment:
 *   - Web standalone: WebAudioInputAdapter (getUserMedia + AnalyserNode)
 *   - WebView in mobile: NativeBridgeAudioInputAdapter (postMessage to RN host)
 *
 * Hooks should use this instead of creating their own bridge/service instances.
 */
export function getAudioInputBridge(): AudioInputBridge {
  if (!instance) {
    const adapter = isNativeEnvironment()
      ? createNativeBridgeAudioInputAdapter()
      : createWebAudioInputAdapter();
    instance = createAudioInputBridge(adapter);
  }
  return instance;
}

/**
 * Allow external injection of a pre-configured bridge (e.g., for testing).
 */
export function setAudioInputBridge(bridge: AudioInputBridge): void {
  instance = bridge;
}

/**
 * Reset the singleton (for testing only).
 */
export function resetAudioInputBridge(): void {
  instance?.dispose();
  instance = null;
}
