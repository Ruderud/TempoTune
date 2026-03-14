#!/usr/bin/env node

import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {Mp3Encoder} = require('lamejsfix');
const ROOT = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(ROOT, 'apps/web/public/qa-audio');
const SAMPLE_RATE = 44_100;
const BIT_RATE_KBPS = 128;

const noteSamples = [
  {id: 'reference_a4_note', note: 'A', octave: 4, frequency: 440.0, instrument: 'reference'},
  {id: 'reference_e2_note', note: 'E', octave: 2, frequency: 82.41, instrument: 'reference'},
  {id: 'guitar_open_e2_note', note: 'E', octave: 2, frequency: 82.41, instrument: 'guitar'},
  {id: 'guitar_open_a2_note', note: 'A', octave: 2, frequency: 110.0, instrument: 'guitar'},
  {id: 'guitar_open_d3_note', note: 'D', octave: 3, frequency: 146.83, instrument: 'guitar'},
  {id: 'guitar_open_g3_note', note: 'G', octave: 3, frequency: 196.0, instrument: 'guitar'},
  {id: 'guitar_open_b3_note', note: 'B', octave: 3, frequency: 246.94, instrument: 'guitar'},
  {id: 'guitar_open_e4_note', note: 'E', octave: 4, frequency: 329.63, instrument: 'guitar'},
  {id: 'bass_open_e1_note', note: 'E', octave: 1, frequency: 41.2, instrument: 'bass'},
  {id: 'bass_open_a1_note', note: 'A', octave: 1, frequency: 55.0, instrument: 'bass'},
  {id: 'bass_open_d2_note', note: 'D', octave: 2, frequency: 73.42, instrument: 'bass'},
  {id: 'bass_open_g2_note', note: 'G', octave: 2, frequency: 98.0, instrument: 'bass'},
];

const rhythmSamples = [
  {
    id: 'rhythm_quarter_120bpm_on_time',
    bpm: 120,
    beatsPerBar: 4,
    bars: 4,
    pulseOffsetMs: 0,
    prerollMs: 600,
  },
  {
    id: 'rhythm_quarter_120bpm_late_35ms',
    bpm: 120,
    beatsPerBar: 4,
    bars: 4,
    pulseOffsetMs: 35,
    prerollMs: 600,
  },
];

mkdirSync(OUTPUT_DIR, {recursive: true});

const manifest = {
  generatedAt: new Date().toISOString(),
  sampleRate: SAMPLE_RATE,
  samples: [],
};

for (const sample of noteSamples) {
  const pcm = generateNoteSample(sample.frequency, sample.instrument);
  writeSampleAssets(sample.id, pcm);
  manifest.samples.push({
    id: sample.id,
    category: 'note',
    instrument: sample.instrument,
    note: sample.note,
    octave: sample.octave,
    frequency: sample.frequency,
    wavPath: `/qa-audio/${sample.id}.wav`,
    mp3Path: `/qa-audio/${sample.id}.mp3`,
  });
}

for (const sample of rhythmSamples) {
  const pcm = generateRhythmSample(sample);
  writeSampleAssets(sample.id, pcm);
  manifest.samples.push({
    id: sample.id,
    category: 'rhythm',
    bpm: sample.bpm,
    beatsPerBar: sample.beatsPerBar,
    bars: sample.bars,
    wavPath: `/qa-audio/${sample.id}.wav`,
    mp3Path: `/qa-audio/${sample.id}.mp3`,
  });
}

writeFileSync(
  resolve(OUTPUT_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
  'utf8',
);

function generateNoteSample(frequency, instrument = 'reference') {
  const durationSeconds = 2.4;
  const totalSamples = Math.round(durationSeconds * SAMPLE_RATE);
  const out = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.02);
    const fadeOut = Math.min(1, (durationSeconds - t) / 0.03);
    const envelope = Math.max(0, attack * fadeOut);
    if (instrument === 'reference') {
      const fundamental = Math.sin(2 * Math.PI * frequency * t);
      const support = 0.08 * Math.sin(2 * Math.PI * frequency * 2 * t);
      out[i] = clampSample((fundamental + support) * 0.72 * envelope);
      continue;
    }

    const shimmer = 1 + 0.0025 * Math.sin(2 * Math.PI * 5.2 * t);
    const fundamental = Math.sin(2 * Math.PI * frequency * shimmer * t);
    const harmonic2 = 0.34 * Math.sin(2 * Math.PI * frequency * 2 * t + 0.15);
    const harmonic3 = 0.16 * Math.sin(2 * Math.PI * frequency * 3 * t + 0.31);
    const harmonic4 = 0.08 * Math.sin(2 * Math.PI * frequency * 4 * t + 0.52);
    const body = (0.72 * fundamental) + harmonic2 + harmonic3 + harmonic4;

    out[i] = clampSample(body * 0.78 * envelope);
  }

  return out;
}

function generateRhythmSample({
  bpm,
  beatsPerBar,
  bars,
  pulseOffsetMs,
  prerollMs,
}) {
  const beatIntervalMs = 60_000 / bpm;
  const totalBeats = beatsPerBar * bars;
  const tailMs = 600;
  const durationMs = prerollMs + (totalBeats * beatIntervalMs) + tailMs;
  const totalSamples = Math.round((durationMs / 1000) * SAMPLE_RATE);
  const out = new Float32Array(totalSamples);

  for (let beat = 0; beat < totalBeats; beat += 1) {
    const startMs = prerollMs + (beat * beatIntervalMs) + pulseOffsetMs;
    const startIndex = Math.round((startMs / 1000) * SAMPLE_RATE);
    const pulseSamples = Math.round(0.045 * SAMPLE_RATE);

    for (let i = 0; i < pulseSamples && startIndex + i < totalSamples; i += 1) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 34);
      const tone = Math.sin(2 * Math.PI * 1320 * t) + (0.45 * Math.sin(2 * Math.PI * 2140 * t));
      const noise = deterministicNoise(beat, i);
      out[startIndex + i] = clampSample(out[startIndex + i] + (0.62 * env * ((0.76 * tone) + (0.24 * noise))));
    }
  }

  return out;
}

function deterministicNoise(seedA, seedB) {
  const value = Math.sin((seedA + 1) * 12.9898 + (seedB + 1) * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function writeSampleAssets(id, floatSamples) {
  const pcmSamples = floatToPcm16(floatSamples);
  const wavBuffer = encodeWav(pcmSamples);
  const mp3Buffer = encodeMp3(pcmSamples);

  writeFileSync(resolve(OUTPUT_DIR, `${id}.wav`), wavBuffer);
  writeFileSync(resolve(OUTPUT_DIR, `${id}.mp3`), mp3Buffer);
}

function floatToPcm16(floatSamples) {
  const pcm = new Int16Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i += 1) {
    const sample = clampSample(floatSamples[i]);
    pcm[i] = sample < 0
      ? Math.round(sample * 0x8000)
      : Math.round(sample * 0x7fff);
  }
  return pcm;
}

function encodeWav(pcmSamples) {
  const byteLength = pcmSamples.length * 2;
  const buffer = Buffer.alloc(44 + byteLength);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + byteLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(byteLength, 40);

  for (let i = 0; i < pcmSamples.length; i += 1) {
    buffer.writeInt16LE(pcmSamples[i], 44 + (i * 2));
  }

  return buffer;
}

function encodeMp3(pcmSamples) {
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, BIT_RATE_KBPS);
  const chunks = [];
  const blockSize = 1152;

  for (let i = 0; i < pcmSamples.length; i += blockSize) {
    const mp3Chunk = encoder.encodeBuffer(pcmSamples.subarray(i, i + blockSize));
    if (mp3Chunk.length > 0) {
      chunks.push(Buffer.from(mp3Chunk));
    }
  }

  const flushChunk = encoder.flush();
  if (flushChunk.length > 0) {
    chunks.push(Buffer.from(flushChunk));
  }

  return Buffer.concat(chunks);
}

function clampSample(value) {
  return Math.max(-0.999, Math.min(0.999, value));
}
