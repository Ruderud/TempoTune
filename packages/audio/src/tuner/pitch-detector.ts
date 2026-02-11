import type { PitchDetectionResult, YinConfig } from './tuner-engine.types';
import {
  YIN_THRESHOLD,
  YIN_PROBABILITY_THRESHOLD,
  DEFAULT_SAMPLE_RATE,
  DEFAULT_BUFFER_SIZE,
} from '@tempo-tune/shared/constants';

const DEFAULT_YIN_CONFIG: YinConfig = {
  threshold: YIN_THRESHOLD,
  probabilityThreshold: YIN_PROBABILITY_THRESHOLD,
  sampleRate: DEFAULT_SAMPLE_RATE,
  bufferSize: DEFAULT_BUFFER_SIZE,
};

export class PitchDetector {
  private config: YinConfig;
  private yinBuffer: Float32Array;

  constructor(config: Partial<YinConfig> = {}) {
    this.config = { ...DEFAULT_YIN_CONFIG, ...config };
    this.yinBuffer = new Float32Array(Math.floor(this.config.bufferSize / 2));
  }

  /**
   * YIN 알고리즘으로 피치 감지
   * @param audioData - 오디오 샘플 데이터 (Float32Array)
   * @returns 감지된 주파수와 확률, 또는 null
   */
  detect(audioData: Float32Array): PitchDetectionResult {
    const halfBufferSize = this.yinBuffer.length;

    // Step 1: 차이 함수 (Difference function)
    this.difference(audioData, halfBufferSize);

    // Step 2: 누적 평균 정규화 차이 함수
    this.cumulativeMeanNormalizedDifference(halfBufferSize);

    // Step 3: 절대 임계값으로 첫 번째 최소값 찾기
    const tauEstimate = this.absoluteThreshold(halfBufferSize);

    if (tauEstimate === -1) {
      return null;
    }

    // Step 4: 파라볼릭 보간으로 정밀도 향상
    const betterTau = this.parabolicInterpolation(tauEstimate, halfBufferSize);

    // 주파수 계산
    const frequency = this.config.sampleRate / betterTau;

    // 확률 계산 (1 - 정규화된 차이 값)
    const probability = 1 - this.yinBuffer[tauEstimate];

    if (probability < this.config.probabilityThreshold) {
      return null;
    }

    // 유효 주파수 범위 확인 (20Hz ~ 5000Hz)
    if (frequency < 20 || frequency > 5000) {
      return null;
    }

    return { frequency, probability };
  }

  updateConfig(config: Partial<YinConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.bufferSize) {
      this.yinBuffer = new Float32Array(Math.floor(config.bufferSize / 2));
    }
  }

  /** Step 1: 차이 함수 */
  private difference(audioData: Float32Array, halfBufferSize: number): void {
    for (let tau = 0; tau < halfBufferSize; tau++) {
      this.yinBuffer[tau] = 0;
      for (let i = 0; i < halfBufferSize; i++) {
        const delta = audioData[i] - audioData[i + tau];
        this.yinBuffer[tau] += delta * delta;
      }
    }
  }

  /** Step 2: 누적 평균 정규화 차이 함수 */
  private cumulativeMeanNormalizedDifference(halfBufferSize: number): void {
    this.yinBuffer[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau < halfBufferSize; tau++) {
      runningSum += this.yinBuffer[tau];
      this.yinBuffer[tau] = (this.yinBuffer[tau] * tau) / runningSum;
    }
  }

  /** Step 3: 절대 임계값 */
  private absoluteThreshold(halfBufferSize: number): number {
    // tau = 2부터 시작 (0, 1은 의미없음)
    for (let tau = 2; tau < halfBufferSize; tau++) {
      if (this.yinBuffer[tau] < this.config.threshold) {
        // 로컬 최소값 찾기
        while (
          tau + 1 < halfBufferSize &&
          this.yinBuffer[tau + 1] < this.yinBuffer[tau]
        ) {
          tau++;
        }
        return tau;
      }
    }
    return -1;
  }

  /** Step 4: 파라볼릭 보간 */
  private parabolicInterpolation(
    tauEstimate: number,
    halfBufferSize: number
  ): number {
    if (tauEstimate <= 0 || tauEstimate >= halfBufferSize - 1) {
      return tauEstimate;
    }

    const s0 = this.yinBuffer[tauEstimate - 1];
    const s1 = this.yinBuffer[tauEstimate];
    const s2 = this.yinBuffer[tauEstimate + 1];

    const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));

    return tauEstimate + adjustment;
  }
}
