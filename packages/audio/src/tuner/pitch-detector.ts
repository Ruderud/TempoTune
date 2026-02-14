import type {
  PitchCandidateDebug,
  PitchDetectionDebug,
  PitchDetectionResult,
  YinConfig,
} from './tuner-engine.types';
import {
  YIN_THRESHOLD,
  YIN_PROBABILITY_THRESHOLD,
  DEFAULT_SAMPLE_RATE,
  DEFAULT_BUFFER_SIZE,
} from '@tempo-tune/shared/constants';

const EPSILON = 1e-12;

const DEFAULT_YIN_CONFIG: YinConfig = {
  threshold: YIN_THRESHOLD,
  probabilityThreshold: YIN_PROBABILITY_THRESHOLD,
  sampleRate: DEFAULT_SAMPLE_RATE,
  bufferSize: DEFAULT_BUFFER_SIZE,
  minFrequency: 55,
  maxFrequency: 1400,
  rmsThreshold: 0.01,
  differenceStep: 1,
  smoothingAlpha: 0.22,
  medianWindowSize: 5,
  maxJumpCents: 80,
  silenceHoldFrames: 3,
  octaveSimilarityTolerance: 0.08,
  harmonicThreshold: 0.45,
  debug: false,
};

type BaseLagCandidate = {
  lag: number;
  cmnd: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function centsDistance(a: number, b: number): number {
  return Math.abs(1200 * Math.log2(a / b));
}

export class PitchDetector {
  private config: YinConfig;
  private yinBuffer: Float32Array;
  private workingBuffer: Float32Array;
  private window: Float32Array;
  private previousFrequency: number | null = null;
  private recentRawFrequencies: number[] = [];
  private silenceFrames = 0;

  constructor(config: Partial<YinConfig> = {}) {
    this.config = this.buildConfig(config);
    this.yinBuffer = new Float32Array(Math.floor(this.config.bufferSize / 2) + 2);
    this.workingBuffer = new Float32Array(this.config.bufferSize);
    this.window = this.createHannWindow(this.config.bufferSize);
  }

  /**
   * Hybrid pitch detection:
   * 1) YIN candidate extraction
   * 2) octave candidate expansion and harmonic consistency scoring
   * 3) temporal stabilization (median + EMA + jump limit)
   */
  detect(audioData: Float32Array): PitchDetectionResult {
    if (audioData.length < this.config.bufferSize) return null;

    const rms = this.prepareWorkingBuffer(audioData);
    if (rms < this.config.rmsThreshold) {
      return this.handleSilence();
    }

    this.silenceFrames = 0;
    const { minLag, maxLag } = this.getLagRange();
    this.difference(maxLag);
    this.cumulativeMeanNormalizedDifference(maxLag);

    const baseCandidates = this.collectBaseCandidates(minLag, maxLag);
    if (baseCandidates.length === 0) {
      return null;
    }

    const lagCandidates = this.expandOctaveCandidates(baseCandidates, minLag, maxLag);
    const scoredCandidates = lagCandidates
      .map((lag) => this.scoreLagCandidate(lag, minLag, maxLag))
      .filter((candidate): candidate is PitchCandidateDebug => candidate !== null)
      .sort((a, b) => b.score - a.score);

    if (scoredCandidates.length === 0) {
      return null;
    }

    const best = scoredCandidates[0];
    const confidence = clamp(best.score, 0, 1);
    if (confidence < this.config.probabilityThreshold) {
      return null;
    }

    if (best.periodicity < this.config.harmonicThreshold && best.yinScore < 0.7) {
      return null;
    }

    const smoothedFrequency = this.smoothFrequency(best.frequency);
    const debug = this.config.debug
      ? this.createDebugPayload({
          rms,
          gatePassed: true,
          confidence,
          rawFrequency: best.frequency,
          smoothedFrequency,
          chosenLag: best.lag,
          candidates: scoredCandidates,
        })
      : undefined;

    return {
      frequency: smoothedFrequency,
      rawFrequency: best.frequency,
      smoothedFrequency,
      confidence,
      probability: confidence,
      rms,
      lag: best.lag,
      debug,
    };
  }

  updateConfig(config: Partial<YinConfig>): void {
    const prevBufferSize = this.config.bufferSize;
    this.config = this.buildConfig(config, this.config);

    if (prevBufferSize !== this.config.bufferSize) {
      this.yinBuffer = new Float32Array(Math.floor(this.config.bufferSize / 2) + 2);
      this.workingBuffer = new Float32Array(this.config.bufferSize);
      this.window = this.createHannWindow(this.config.bufferSize);
      this.previousFrequency = null;
      this.recentRawFrequencies = [];
      this.silenceFrames = 0;
    }
  }

  private buildConfig(override: Partial<YinConfig>, base = DEFAULT_YIN_CONFIG): YinConfig {
    const merged: YinConfig = {
      ...base,
      ...override,
    };

    merged.bufferSize = Math.max(512, Math.floor(merged.bufferSize));
    merged.sampleRate = Math.max(8000, merged.sampleRate);
    merged.minFrequency = Math.max(20, merged.minFrequency);
    merged.maxFrequency = Math.max(merged.minFrequency + 20, merged.maxFrequency);
    merged.threshold = clamp(merged.threshold, 0.02, 0.4);
    merged.probabilityThreshold = clamp(merged.probabilityThreshold, 0.05, 0.95);
    merged.rmsThreshold = clamp(merged.rmsThreshold, 0.0005, 0.3);
    merged.differenceStep = Math.max(1, Math.floor(merged.differenceStep));
    merged.smoothingAlpha = clamp(merged.smoothingAlpha, 0.01, 1);
    merged.medianWindowSize = Math.max(1, Math.floor(merged.medianWindowSize));
    if (merged.medianWindowSize % 2 === 0) merged.medianWindowSize += 1;
    merged.maxJumpCents = clamp(merged.maxJumpCents, 5, 1200);
    merged.silenceHoldFrames = Math.max(0, Math.floor(merged.silenceHoldFrames));
    merged.octaveSimilarityTolerance = clamp(merged.octaveSimilarityTolerance, 0, 0.25);
    merged.harmonicThreshold = clamp(merged.harmonicThreshold, 0, 1);

    return merged;
  }

  private handleSilence(): PitchDetectionResult {
    this.silenceFrames += 1;
    if (this.silenceFrames >= this.config.silenceHoldFrames) {
      this.previousFrequency = null;
      this.recentRawFrequencies = [];
    }
    return null;
  }

  private createHannWindow(length: number): Float32Array {
    const out = new Float32Array(length);
    if (length <= 1) {
      out[0] = 1;
      return out;
    }

    for (let i = 0; i < length; i++) {
      out[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
    }

    return out;
  }

  private prepareWorkingBuffer(audioData: Float32Array): number {
    const n = this.config.bufferSize;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += audioData[i];
    }
    const mean = sum / n;

    let rmsAcc = 0;
    for (let i = 0; i < n; i++) {
      const centered = audioData[i] - mean;
      rmsAcc += centered * centered;
      this.workingBuffer[i] = centered * this.window[i];
    }

    return Math.sqrt(rmsAcc / n);
  }

  private getLagRange(): { minLag: number; maxLag: number } {
    const halfBufferSize = Math.floor(this.config.bufferSize / 2);
    const minLag = Math.max(2, Math.floor(this.config.sampleRate / this.config.maxFrequency));
    const maxLag = Math.min(
      halfBufferSize - 1,
      Math.ceil(this.config.sampleRate / this.config.minFrequency),
    );

    return {
      minLag,
      maxLag: Math.max(minLag + 2, maxLag),
    };
  }

  private difference(maxLag: number): void {
    const size = this.config.bufferSize;
    const step = this.config.differenceStep;

    for (let tau = 0; tau <= maxLag; tau++) {
      let sum = 0;
      const limit = size - tau;
      for (let i = 0; i < limit; i += step) {
        const delta = this.workingBuffer[i] - this.workingBuffer[i + tau];
        sum += delta * delta;
      }
      this.yinBuffer[tau] = sum;
    }
  }

  private cumulativeMeanNormalizedDifference(maxLag: number): void {
    this.yinBuffer[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau <= maxLag; tau++) {
      runningSum += this.yinBuffer[tau];
      this.yinBuffer[tau] = runningSum > EPSILON ? (this.yinBuffer[tau] * tau) / runningSum : 1;
    }
  }

  private collectBaseCandidates(minLag: number, maxLag: number): BaseLagCandidate[] {
    const candidates: BaseLagCandidate[] = [];

    for (let tau = minLag + 1; tau < maxLag - 1; tau++) {
      const value = this.yinBuffer[tau];
      if (value > this.config.threshold) continue;
      if (value > this.yinBuffer[tau - 1] || value > this.yinBuffer[tau + 1]) continue;

      const refinedLag = this.parabolicInterpolation(tau, maxLag);
      candidates.push({
        lag: refinedLag,
        cmnd: value,
      });
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.cmnd - b.cmnd);
      return candidates.slice(0, 6);
    }

    // fallback: choose best global minimum in range
    let bestTau = minLag;
    let bestValue = this.yinBuffer[minLag];
    for (let tau = minLag + 1; tau <= maxLag; tau++) {
      if (this.yinBuffer[tau] < bestValue) {
        bestValue = this.yinBuffer[tau];
        bestTau = tau;
      }
    }

    if (bestValue > 0.5) return [];

    return [{
      lag: this.parabolicInterpolation(bestTau, maxLag),
      cmnd: bestValue,
    }];
  }

  private expandOctaveCandidates(
    baseCandidates: BaseLagCandidate[],
    minLag: number,
    maxLag: number,
  ): number[] {
    const uniqueLagSet = new Set<number>();

    for (const base of baseCandidates) {
      const lag = Math.round(base.lag);
      if (lag < minLag || lag > maxLag) continue;
      uniqueLagSet.add(lag);

      const octaveDownLag = lag * 2;
      if (octaveDownLag <= maxLag) {
        const similarEnough = this.yinBuffer[octaveDownLag] <= this.yinBuffer[lag] + this.config.octaveSimilarityTolerance;
        if (similarEnough) {
          uniqueLagSet.add(octaveDownLag);
        }
      }

      const octaveUpLag = Math.round(lag / 2);
      if (octaveUpLag >= minLag) {
        const similarEnough = this.yinBuffer[octaveUpLag] <= this.yinBuffer[lag] + this.config.octaveSimilarityTolerance;
        if (similarEnough) {
          uniqueLagSet.add(octaveUpLag);
        }
      }
    }

    return [...uniqueLagSet].sort((a, b) => a - b);
  }

  private scoreLagCandidate(
    lag: number,
    minLag: number,
    maxLag: number,
  ): PitchCandidateDebug | null {
    if (lag < minLag || lag > maxLag) return null;

    const frequency = this.config.sampleRate / lag;
    if (frequency < this.config.minFrequency || frequency > this.config.maxFrequency) return null;

    const yinScore = clamp(1 - this.yinBuffer[lag], 0, 1);
    const periodicity = this.normalizedAutocorrelation(lag);
    const harmonicScore = this.computeHarmonicScore(lag, maxLag);

    let continuityPenalty = 0;
    if (this.previousFrequency !== null) {
      const jumpCents = centsDistance(frequency, this.previousFrequency);
      continuityPenalty = clamp(jumpCents / this.config.maxJumpCents, 0, 1) * 0.35;
    }

    const score = clamp(
      yinScore * 0.58 + periodicity * 0.24 + harmonicScore * 0.18 - continuityPenalty,
      0,
      1,
    );

    return {
      frequency,
      lag,
      yinScore,
      periodicity,
      harmonicScore,
      continuityPenalty,
      score,
    };
  }

  private normalizedAutocorrelation(lag: number): number {
    let numerator = 0;
    let energyA = 0;
    let energyB = 0;
    const n = this.config.bufferSize - lag;
    const step = this.config.differenceStep;

    for (let i = 0; i < n; i += step) {
      const a = this.workingBuffer[i];
      const b = this.workingBuffer[i + lag];
      numerator += a * b;
      energyA += a * a;
      energyB += b * b;
    }

    const denominator = Math.sqrt(energyA * energyB) + EPSILON;
    return clamp(numerator / denominator, 0, 1);
  }

  private computeHarmonicScore(baseLag: number, maxLag: number): number {
    let score = this.normalizedAutocorrelation(baseLag);
    let totalWeight = 1;

    for (let harmonic = 2; harmonic <= 4; harmonic++) {
      const lag = baseLag * harmonic;
      if (lag > maxLag) break;
      const weight = 1 / harmonic;
      score += this.normalizedAutocorrelation(lag) * weight;
      totalWeight += weight;
    }

    return clamp(score / totalWeight, 0, 1);
  }

  private parabolicInterpolation(tau: number, maxLag: number): number {
    if (tau <= 1 || tau >= maxLag - 1) return tau;

    const s0 = this.yinBuffer[tau - 1];
    const s1 = this.yinBuffer[tau];
    const s2 = this.yinBuffer[tau + 1];
    const denominator = 2 * (2 * s1 - s2 - s0);
    if (Math.abs(denominator) < EPSILON) return tau;

    const adjustment = (s2 - s0) / denominator;
    return tau + adjustment;
  }

  private smoothFrequency(rawFrequency: number): number {
    this.recentRawFrequencies.push(rawFrequency);
    if (this.recentRawFrequencies.length > this.config.medianWindowSize) {
      this.recentRawFrequencies.shift();
    }

    const sorted = [...this.recentRawFrequencies].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    let stabilized = median;

    if (this.previousFrequency !== null) {
      const centsJump = centsDistance(stabilized, this.previousFrequency);
      if (centsJump > this.config.maxJumpCents) {
        const ratioLimit = 2 ** (this.config.maxJumpCents / 1200);
        stabilized = clamp(
          stabilized,
          this.previousFrequency / ratioLimit,
          this.previousFrequency * ratioLimit,
        );
      }

      stabilized = this.previousFrequency + this.config.smoothingAlpha * (stabilized - this.previousFrequency);
    }

    this.previousFrequency = stabilized;
    return stabilized;
  }

  private createDebugPayload(payload: {
    rms: number;
    gatePassed: boolean;
    chosenLag: number;
    rawFrequency: number;
    smoothedFrequency: number;
    confidence: number;
    candidates: PitchCandidateDebug[];
  }): PitchDetectionDebug {
    return {
      rms: payload.rms,
      gatePassed: payload.gatePassed,
      chosenLag: payload.chosenLag,
      rawFrequency: payload.rawFrequency,
      smoothedFrequency: payload.smoothedFrequency,
      confidence: payload.confidence,
      candidates: payload.candidates,
    };
  }
}
