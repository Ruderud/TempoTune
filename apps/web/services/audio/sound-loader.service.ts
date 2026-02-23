import { getAudioContext } from './audio-context.service';

const soundCache = new Map<string, AudioBuffer>();

export async function loadSoundFromUrl(url: string): Promise<AudioBuffer> {
  const cached = soundCache.get(url);
  if (cached) return cached;

  const ctx = getAudioContext();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  soundCache.set(url, audioBuffer);
  return audioBuffer;
}

export async function loadSoundFromFile(file: File): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
}

export function playSynthesizedClick(isAccent: boolean, volume = 0.8, scheduledTime?: number): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  // Use the provided AudioContext time if given, otherwise play immediately.
  const startTime = scheduledTime !== undefined ? scheduledTime : ctx.currentTime;

  oscillator.type = 'sine';
  oscillator.frequency.value = isAccent ? 1000 : 800;

  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + 0.05);
}

export function playAudioBuffer(buffer: AudioBuffer, volume = 0.8, scheduledTime?: number): void {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();

  source.buffer = buffer;
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Use the provided AudioContext time if given, otherwise play immediately.
  const startTime = scheduledTime !== undefined ? scheduledTime : ctx.currentTime;
  source.start(startTime);
}

export function clearSoundCache(): void {
  soundCache.clear();
}
