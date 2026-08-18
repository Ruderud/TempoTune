import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { centsFromPitch } from '@tempo-tune/shared/utils';
import { PitchDetector } from './pitch-detector';

type NoteFixture = {
  id: string;
  category: 'note';
  note: string;
  octave: number;
  frequency: number;
  wavPath: string;
};

type FixtureManifest = {
  sampleRate: number;
  samples: Array<NoteFixture | { category: 'rhythm' }>;
};

const ASSET_ROOT = fileURLToPath(new URL('../../../../qa/assets/audio/', import.meta.url));
const manifest = JSON.parse(
  readFileSync(`${ASSET_ROOT}/manifest.json`, 'utf8'),
) as FixtureManifest;
const noteFixtures = manifest.samples.filter(
  (sample): sample is NoteFixture => sample.category === 'note',
);

function decodeMonoPcm16Wav(path: string): Float32Array {
  const wav = readFileSync(path);
  expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
  expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
  expect(wav.readUInt16LE(20)).toBe(1);
  expect(wav.readUInt16LE(22)).toBe(1);
  expect(wav.readUInt16LE(34)).toBe(16);

  const samples = new Float32Array((wav.length - 44) / 2);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = wav.readInt16LE(44 + index * 2) / 32_768;
  }
  return samples;
}

describe('tuner microphone fixture accuracy', () => {
  it.each(noteFixtures)('$id is detected within the in-tune 5-cent contract', (fixture) => {
    const audio = decodeMonoPcm16Wav(`${ASSET_ROOT}/${fixture.id}.wav`);
    const detector = new PitchDetector({
      sampleRate: manifest.sampleRate,
      bufferSize: 4_096,
      minFrequency: 35,
      maxFrequency: 1_400,
      probabilityThreshold: 0.2,
      rmsThreshold: 0.008,
      smoothingAlpha: 0.2,
      medianWindowSize: 5,
      maxJumpCents: 80,
    });
    const errors: number[] = [];
    let attemptedWindows = 0;

    for (let offset = 8_192; offset + 4_096 <= audio.length - 4_096; offset += 4_096) {
      attemptedWindows += 1;
      const result = detector.detect(audio.subarray(offset, offset + 4_096));
      if (result) errors.push(Math.abs(centsFromPitch(result.frequency, fixture.frequency)));
    }

    expect(errors.length / attemptedWindows).toBeGreaterThanOrEqual(0.9);
    errors.sort((a, b) => a - b);
    const p95Error = errors[Math.ceil(errors.length * 0.95) - 1];
    expect(p95Error).toBeLessThanOrEqual(5);
  });
});
