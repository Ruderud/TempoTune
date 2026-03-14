import type { AudioInputBridge } from '../contracts/audio-input-bridge.interface';
import type { AudioInputPlatformAdapter } from '../contracts/audio-input-platform-adapter.interface';
import { AudioInputBridgeImpl } from './audio-input-bridge';

/**
 * Factory function to create the audio input facade.
 * Apps call this once at startup, passing their platform adapter.
 *
 * Usage:
 *   const audioInput = createAudioInputBridge(webAdapter);
 *   // or
 *   const audioInput = createAudioInputBridge(nativeAdapter);
 */
export function createAudioInputBridge(
  adapter: AudioInputPlatformAdapter,
): AudioInputBridge {
  return new AudioInputBridgeImpl(adapter);
}
