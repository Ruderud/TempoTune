/**
 * Consumer of raw audio frames from a capture session.
 * Web adapters pass Float32Array from AnalyserNode.
 * Native adapters typically don't use this (analysis happens natively).
 */
export type AudioFrameConsumer = (timeDomainData: Float32Array<ArrayBuffer>, sampleRate: number) => void;

/**
 * Configuration for which analyzers to enable during capture.
 */
export type AudioAnalyzerConfig = {
  enablePitch: boolean;
  enableRhythm: boolean;
};
