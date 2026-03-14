import type { AudioInputDevice, AudioCaptureConfig, AudioSessionState, PitchDetectionEvent } from '../types/audio-input.types';
import type { RhythmHitEvent } from '../types/rhythm.types';

/** Request payloads sent from WebView → native */

export type ListAudioInputDevicesRequest = Record<string, never>;

export type SelectAudioInputDeviceRequest = {
  deviceId: string;
};

export type GetSelectedAudioInputDeviceRequest = Record<string, never>;

export type StartAudioCaptureRequest = AudioCaptureConfig;

export type StopAudioCaptureRequest = Record<string, never>;

export type ConfigureAudioAnalyzersRequest = {
  enablePitch: boolean;
  enableRhythm: boolean;
};

/** Response/event payloads sent from native → WebView */

export type AudioInputDevicesResponse = {
  devices: AudioInputDevice[];
};

export type SelectedAudioInputDeviceResponse = {
  device: AudioInputDevice | null;
};

export type AudioInputStateChangedEvent = AudioSessionState;

export type AudioInputRouteChangedEvent = {
  devices: AudioInputDevice[];
};

export type PitchDetectedEvent = PitchDetectionEvent;

export type RhythmHitDetectedEvent = RhythmHitEvent;
