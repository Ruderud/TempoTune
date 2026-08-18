import { describe, expect, it } from 'vitest';
import type { BridgeCommand, BridgeEvent } from './bridge.types';

const commands = [
  { type: 'REQUEST_MIC_PERMISSION' },
  {
    type: 'START_NATIVE_METRONOME',
    data: { bpm: 120, beatsPerMeasure: 4, accentFirst: true },
  },
  { type: 'SELECT_AUDIO_INPUT_DEVICE', data: { deviceId: 'default' } },
  {
    type: 'START_AUDIO_CAPTURE',
    data: {
      deviceId: 'default',
      channelIndex: 0,
      enablePitch: true,
      enableRhythm: false,
    },
  },
] satisfies BridgeCommand[];

const events = [
  {
    type: 'NATIVE_METRONOME_TICK',
    data: { beatIndex: 0, isAccent: true, timestamp: 123 },
  },
  { type: 'AUDIO_INPUT_ROUTE_CHANGED', data: { devices: [] } },
] satisfies BridgeEvent[];

describe('bridge message contracts', () => {
  it('preserves command and event payloads across the JSON wire format', () => {
    const messages = [...commands, ...events];

    expect(JSON.parse(JSON.stringify(messages))).toEqual(messages);
  });

  it('couples command types to their required payloads', () => {
    // @ts-expect-error START_NATIVE_METRONOME requires its data payload.
    const missingPayload: BridgeCommand<'START_NATIVE_METRONOME'> = {
      type: 'START_NATIVE_METRONOME',
    };
    const invalidPayload: BridgeCommand<'SELECT_AUDIO_INPUT_DEVICE'> = {
      type: 'SELECT_AUDIO_INPUT_DEVICE',
      // @ts-expect-error deviceId must be a string.
      data: { deviceId: 1 },
    };

    expect([missingPayload, invalidPayload]).toHaveLength(2);
  });
});
