type AudioContextState = 'running' | 'suspended' | 'closed';

let audioContextInstance: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContextInstance || audioContextInstance.state === 'closed') {
    audioContextInstance = new AudioContext();
  }
  return audioContextInstance;
}

export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

export async function suspendAudioContext(): Promise<void> {
  if (audioContextInstance && audioContextInstance.state === 'running') {
    await audioContextInstance.suspend();
  }
}

export function getAudioContextState(): AudioContextState {
  if (!audioContextInstance) return 'closed';
  return audioContextInstance.state as AudioContextState;
}
