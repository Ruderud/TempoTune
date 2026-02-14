import type {
  TunerNote,
  TuningPreset,
  TuningString,
} from '@tempo-tune/shared/types';
import {
  A4_FREQUENCY,
  ALL_TUNING_PRESETS,
} from '@tempo-tune/shared/constants';
import { frequencyToNote, centsFromPitch } from '@tempo-tune/shared/utils';
import type {
  PitchDetectionResult,
  TunerEngineConfig,
  YinConfig,
} from './tuner-engine.types';
import { PitchDetector } from './pitch-detector';

export class TunerEngine {
  private config: TunerEngineConfig;
  private pitchDetector: PitchDetector;
  private currentPreset: TuningPreset;

  constructor(config?: Partial<TunerEngineConfig>) {
    this.config = {
      sampleRate: config?.sampleRate ?? 44100,
      bufferSize: config?.bufferSize ?? 4096,
      referenceFrequency: config?.referenceFrequency ?? A4_FREQUENCY,
      minFrequency: config?.minFrequency ?? 55,
      maxFrequency: config?.maxFrequency ?? 1400,
    };
    this.pitchDetector = new PitchDetector({
      sampleRate: this.config.sampleRate,
      bufferSize: this.config.bufferSize,
      minFrequency: this.config.minFrequency,
      maxFrequency: this.config.maxFrequency,
    });
    this.currentPreset = ALL_TUNING_PRESETS[0];
  }

  detectPitch(audioData: Float32Array): PitchDetectionResult {
    return this.pitchDetector.detect(audioData);
  }

  /**
   * 오디오 데이터를 처리하여 음계 정보 반환
   */
  processAudioData(audioData: Float32Array): TunerNote | null {
    const result = this.detectPitch(audioData);
    if (!result) return null;

    return frequencyToNote(result.frequency, this.config.referenceFrequency);
  }

  /**
   * 감지된 주파수에 가장 가까운 목표 줄 찾기
   */
  findClosestString(frequency: number): TuningString | null {
    if (this.currentPreset.strings.length === 0) return null;

    let closestString = this.currentPreset.strings[0];
    let minCents = Math.abs(centsFromPitch(frequency, closestString.frequency));

    for (let i = 1; i < this.currentPreset.strings.length; i++) {
      const string = this.currentPreset.strings[i];
      const cents = Math.abs(centsFromPitch(frequency, string.frequency));
      if (cents < minCents) {
        minCents = cents;
        closestString = string;
      }
    }

    return closestString;
  }

  /**
   * 목표 줄 대비 cents 오차 계산
   */
  getCentsFromTarget(frequency: number, target: TuningString): number {
    return centsFromPitch(frequency, target.frequency);
  }

  setPreset(preset: TuningPreset): void {
    this.currentPreset = preset;
  }

  getPreset(): TuningPreset {
    return this.currentPreset;
  }

  setReferenceFrequency(frequency: number): void {
    this.config.referenceFrequency = frequency;
  }

  setAudioConfig(config: Partial<Pick<TunerEngineConfig, 'sampleRate' | 'bufferSize'>>): void {
    const pitchDetectorConfig: { sampleRate?: number; bufferSize?: number } = {};

    if (typeof config.sampleRate === 'number') {
      this.config.sampleRate = config.sampleRate;
      pitchDetectorConfig.sampleRate = config.sampleRate;
    }

    if (typeof config.bufferSize === 'number') {
      this.config.bufferSize = config.bufferSize;
      pitchDetectorConfig.bufferSize = config.bufferSize;
    }

    if (Object.keys(pitchDetectorConfig).length > 0) {
      this.pitchDetector.updateConfig(pitchDetectorConfig);
    }
  }

  setPitchDetectionConfig(config: Partial<YinConfig>): void {
    this.pitchDetector.updateConfig(config);
    if (typeof config.sampleRate === 'number') {
      this.config.sampleRate = config.sampleRate;
    }
    if (typeof config.bufferSize === 'number') {
      this.config.bufferSize = config.bufferSize;
    }
    if (typeof config.minFrequency === 'number') {
      this.config.minFrequency = config.minFrequency;
    }
    if (typeof config.maxFrequency === 'number') {
      this.config.maxFrequency = config.maxFrequency;
    }
  }

  getReferenceFrequency(): number {
    return this.config.referenceFrequency;
  }

  dispose(): void {
    // 정리 작업 (현재는 없음)
  }
}
