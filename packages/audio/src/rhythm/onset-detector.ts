import type { OnsetDetectorConfig } from './rhythm-engine.types';
import { DEFAULT_ONSET_CONFIG } from './rhythm-engine.types';

/**
 * Onset detector using RMS energy + energy flux with adaptive threshold.
 * All operations are O(n) per frame — no DFT computation.
 *
 * Detection strategy:
 * 1. RMS gate: reject silent frames
 * 2. Energy flux: compare per-sample squared energy between consecutive frames
 *    (only positive increases count — half-wave rectified flux)
 * 3. Adaptive threshold: flux must exceed rolling mean * multiplier
 * 4. Refractory window: suppress repeated triggers
 */
export class OnsetDetector {
  private config: OnsetDetectorConfig;
  private lastOnsetAtMs: number = 0;
  private fluxHistory: number[] = [];
  private prevEnergy: Float32Array | null = null;

  constructor(config: Partial<OnsetDetectorConfig> = {}) {
    this.config = { ...DEFAULT_ONSET_CONFIG, ...config };
  }

  /**
   * Process a time-domain audio frame and return onset time if detected.
   * @param timeDomainData - Float32Array of audio samples
   * @param nowMonotonicMs - current monotonic timestamp in ms
   * @returns monotonic timestamp of onset if detected, null otherwise
   */
  detect(timeDomainData: Float32Array, nowMonotonicMs: number): number | null {
    // Refractory period check
    if (nowMonotonicMs - this.lastOnsetAtMs < this.config.refractoryWindowMs) {
      return null;
    }

    // RMS energy check
    const rms = this.computeRms(timeDomainData);
    if (rms < this.config.rmsThreshold) {
      return null;
    }

    // Compute per-sample energy and energy flux (O(n))
    const energy = this.computeEnergy(timeDomainData);
    const flux = this.computeEnergyFlux(energy);

    // Update adaptive threshold
    this.fluxHistory.push(flux);
    if (this.fluxHistory.length > this.config.adaptiveWindowSize) {
      this.fluxHistory.shift();
    }

    const meanFlux =
      this.fluxHistory.reduce((sum, v) => sum + v, 0) / this.fluxHistory.length;
    const threshold = meanFlux * this.config.fluxThresholdMultiplier;

    this.prevEnergy = energy;

    if (flux > threshold && flux > 0) {
      this.lastOnsetAtMs = nowMonotonicMs;
      return nowMonotonicMs;
    }

    return null;
  }

  reset(): void {
    this.lastOnsetAtMs = 0;
    this.fluxHistory = [];
    this.prevEnergy = null;
  }

  private computeRms(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  /**
   * Compute per-sample squared energy — O(n).
   * Downsampled by factor of 4 to reduce memory and comparison cost.
   */
  private computeEnergy(timeDomain: Float32Array): Float32Array {
    const step = 4;
    const len = Math.floor(timeDomain.length / step);
    const energy = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const idx = i * step;
      // Sum energy over the step window
      let e = 0;
      for (let j = 0; j < step && idx + j < timeDomain.length; j++) {
        const s = timeDomain[idx + j];
        e += s * s;
      }
      energy[i] = e;
    }
    return energy;
  }

  /**
   * Half-wave rectified energy flux — O(n).
   * Only counts increases in energy (attack transients).
   */
  private computeEnergyFlux(currentEnergy: Float32Array): number {
    if (!this.prevEnergy || this.prevEnergy.length !== currentEnergy.length) {
      return 0;
    }

    let flux = 0;
    for (let i = 0; i < currentEnergy.length; i++) {
      const diff = currentEnergy[i] - this.prevEnergy[i];
      if (diff > 0) {
        flux += diff;
      }
    }

    return flux;
  }
}
